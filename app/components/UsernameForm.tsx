"use client";

import { updateName } from "../actions/user";

export function UsernameForm() {
  return (
    <form
      action={async (formData) => {
        await updateName(formData);
      }}
    >
      <input
        type="text"
        name="username"
        placeholder="Enter new username"
        required
      />
      <button type="submit">Update Username</button>
    </form>
  );
}
