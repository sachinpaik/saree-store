import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPriceInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceAed(amount: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getWhatsAppLink(phone: string, message?: string) {
  const clean = phone.replace(/\D/g, "");
  const text = message ? `&text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${text}`;
}

export function getTelLink(phone: string) {
  return `tel:${phone.replace(/\D/g, "").replace(/^0/, "")}`;
}
