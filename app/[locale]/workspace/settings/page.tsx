import { UserProfile } from "@clerk/nextjs";

export default function Settings() {
  return (
    <div className="w-full">
      <UserProfile />
    </div>
  );
}
