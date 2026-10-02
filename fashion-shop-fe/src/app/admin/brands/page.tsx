import { redirect } from "next/navigation";

export default function AdminBrandsRedirectPage() {
  redirect("/admin/classifications?tab=brands");
}
