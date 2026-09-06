"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function createUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = parseRole(formData.get("role")) ?? Role.STAFF;

  if (!email || !name || password.length < 8) {
    console.error("Name, email, and password (8+ chars) are required.");
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, name, passwordHash, role, active: true },
    });
    revalidateAdmin();
  } catch (err) {
    console.error(err);
  }
}

export async function updateUser(formData: FormData): Promise<void> {
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
    console.error("Missing required fields.");
    return;
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
        console.error("New password must be at least 8 characters.");
        return;
      }
      data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({ where: { id }, data });
    revalidateAdmin();
  } catch (err) {
    console.error(err);
  }
}

export async function deactivateUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    console.error("Missing user id.");
    return;
  }

  const session = await requireAdmin();
  if (session.user.id === id) {
    console.error("You cannot deactivate your own account.");
    return;
  }

  try {
    await prisma.user.update({ where: { id }, data: { active: false } });
    revalidateAdmin();
  } catch (err) {
    console.error(err);
  }
}

export async function createProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null;

  if (!sku || !name) {
    console.error("SKU and name are required.");
    return;
  }

  try {
    await prisma.product.create({
      data: { sku, name, description, vendorId, active: true },
    });
    revalidateAdmin();
  } catch (err) {
    console.error(err);
  }
}

export async function updateProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null;
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!id || !sku || !name) {
    console.error("Missing required fields.");
    return;
  }

  try {
    await prisma.product.update({
      where: { id },
      data: { sku, name, description, vendorId, active },
    });
    revalidateAdmin();
  } catch (err) {
    console.error(err);
  }
}

export async function createVendor(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const adapterType = String(formData.get("adapterType") ?? "").trim() || "email_pdf";
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const orderDaysOfWeek = parseDaysOfWeek(String(formData.get("orderDaysOfWeek") ?? ""));
  const blackoutDates = parseBlackoutDates(String(formData.get("blackoutDates") ?? ""));

  if (!name) {
    console.error("Name is required.");
    return;
  }

  try {
    await prisma.vendor.create({
      data: { name, adapterType, contactEmail, orderDaysOfWeek, blackoutDates, active: true },
    });
    revalidateAdmin();
  } catch (err) {
    console.error(err);
  }
}

export async function updateVendor(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const adapterType = String(formData.get("adapterType") ?? "").trim() || "email_pdf";
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const orderDaysOfWeek = parseDaysOfWeek(String(formData.get("orderDaysOfWeek") ?? ""));
  const blackoutDates = parseBlackoutDates(String(formData.get("blackoutDates") ?? ""));
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!id || !name) {
    console.error("Missing required fields.");
    return;
  }

  try {
    await prisma.vendor.update({
      where: { id },
      data: { name, adapterType, contactEmail, orderDaysOfWeek, blackoutDates, active },
    });
    revalidateAdmin();
  } catch (err) {
    console.error(err);
  }
}

export async function createLocation(formData: FormData): Promise<void> {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();

  if (!code || !name) {
    console.error("Code and name are required.");
    return;
  }

  try {
    await prisma.storeLocation.create({
      data: { code, name, active: true },
    });
    revalidateAdmin();
  } catch (err) {
    console.error(err);
  }
}

export async function updateLocation(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!id || !code || !name) {
    console.error("Missing required fields.");
    return;
  }

  try {
    await prisma.storeLocation.update({
      where: { id },
      data: { code, name, active },
    });
    revalidateAdmin();
  } catch (err) {
    console.error(err);
  }
}
