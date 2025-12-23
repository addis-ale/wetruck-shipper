import { redirect } from "next/navigation";

export default function Home() {
  // In a real app, we would check the user's role and session here.
  // For the MVP Shipper app, we'll start at the sign-in page.
  redirect("/sign-in");
}
