import { signOut } from "../actions";

export async function POST() {
  await signOut();
}
