"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

function parseRole(value: FormDataEntryValue | null): Role | null {
  const v = String(value ?? "");
  if (v === "ADMIN" || v === "MANAGER" || v === "STAFF") return v;
  return null;
}

function parseDaysOfWeek(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

function parseBlackoutDates(raw: string): Date[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => new Date(`${s}T00:00:00.000Z`))
    .filter((d) => !Number.isNaN(d.getTime()));
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/products");
  revalidatePath("/admin/vendors");
  revalidatePath("/admin/locations");
  revalidatePath("/inventory");
  revalidatePath("/ordering");
  revalidatePath("/vendors");
  revalidatePath("/reports");
}

export async function createUser(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = parseRole(formData.get("role")) ?? Role.STAFF;

  if (!email || !name || password.length < 8) {
    return { ok: false, error: "Name, email, and password (8+ chars) are required." };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, name, passwordHash, role, active: true },
    });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not create user (email may already exist)." };
  }
}

export async function updateUser(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = parseRole(formData.get("role"));
  const active = formData.get("active") === "on" || formData.get("active") === "true";
  const newPassword = String(formData.get("password") ?? "");

  if (!id || !email || !name || !role) {
    return { ok: false, error: "Missing required fields." };
  }

  try {
    const data: {
      email: string;
      name: string;
      role: Role;
      active: boolean;
      passwordHash?: string;
    } = { email, name, role, active };

    if (newPassword) {
      if (newPassword.length < 8) {
        return { ok: false, error: "New password must be at least 8 characters." };
      }
      data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({ where: { id }, data });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not update user." };
  }
}

export async function deactivateUser(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing user id." };

  const session = await requireAdmin();
  if (session.user.id === id) {
    return { ok: false, error: "You cannot deactivate your own account." };
  }

  try {
    await prisma.user.update({ where: { id }, data: { active: false } });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not deactivate user." };
  }
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null;

  if (!sku || !name) return { ok: false, error: "SKU and name are required." };

  try {
    await prisma.product.create({
      data: { sku, name, description, vendorId, active: true },
    });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not create product (SKU may already exist)." };
  }
}

export async function updateProduct(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null;
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!id || !sku || !name) return { ok: false, error: "Missing required fields." };

  try {
    await prisma.product.update({
      where: { id },
      data: { sku, name, description, vendorId, active },
    });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not update product." };
  }
}

export async function createVendor(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const adapterType = String(formData.get("adapterType") ?? "").trim() || "email_pdf";
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const orderDaysOfWeek = parseDaysOfWeek(String(formData.get("orderDaysOfWeek") ?? ""));
  const blackoutDates = parseBlackoutDates(String(formData.get("blackoutDates") ?? ""));

  if (!name) return { ok: false, error: "Name is required." };

  try {
    await prisma.vendor.create({
      data: { name, adapterType, contactEmail, orderDaysOfWeek, blackoutDates, active: true },
    });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not create vendor." };
  }
}

export async function updateVendor(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const adapterType = String(formData.get("adapterType") ?? "").trim() || "email_pdf";
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const orderDaysOfWeek = parseDaysOfWeek(String(formData.get("orderDaysOfWeek") ?? ""));
  const blackoutDates = parseBlackoutDates(String(formData.get("blackoutDates") ?? ""));
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!id || !name) return { ok: false, error: "Missing required fields." };

  try {
    await prisma.vendor.update({
      where: { id },
      data: { name, adapterType, contactEmail, orderDaysOfWeek, blackoutDates, active },
    });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not update vendor." };
  }
}

export async function createLocation(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();

  if (!code || !name) return { ok: false, error: "Code and name are required." };

  try {
    await prisma.storeLocation.create({
      data: { code, name, active: true },
    });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not create location (code may already exist)." };
  }
}

export async function updateLocation(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!id || !code || !name) return { ok: false, error: "Missing required fields." };

  try {
    await prisma.storeLocation.update({
      where: { id },
      data: { code, name, active },
    });
    revalidateAdmin();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not update location." };
  }
}
