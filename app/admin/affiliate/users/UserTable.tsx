"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
  clickId: string | null;
  createdAt: Date;
  paid: boolean | null;
  refferal: string | null;
  _count: {
    alertClicks: number;
  };
}

interface UserTableProps {
  users: User[];
  currentUserEmail: string;
}

export default function UserTable({ users, currentUserEmail }: UserTableProps) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const router = useRouter();

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeletingUserId(userToDelete.id);
    setShowConfirmDialog(false);

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the page to show updated user list
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to delete user: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    } finally {
      setDeletingUserId(null);
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setUserToDelete(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                User
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                ClickID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Coupon Code
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Registration Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Paid Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Clicks
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium">
                        {user.name || "No Name"}
                      </div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {user.clickId ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-800 text-green-100">
                        {user.clickId}
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                        No ClickID
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {user.refferal ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-800 text-blue-100">
                        {user.refferal}
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                        No Code
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.paid
                        ? "bg-green-800 text-green-100"
                        : "bg-yellow-800 text-yellow-100"
                    }`}
                  >
                    {user.paid ? "Paid" : "Free"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                    {user._count.alertClicks} clicks
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {user.clickId && (
                      <a
                        href={`/api/postback?clickid=${user.clickId}`}
                        target="_blank"
                        className="text-green-400 hover:text-green-300"
                      >
                        Send Postback
                      </a>
                    )}
                    <Link
                      href={`/admin/affiliate/users/${user.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View Details
                    </Link>
                    {user.email !== currentUserEmail && (
                      <button
                        onClick={() => handleDeleteClick(user)}
                        disabled={deletingUserId === user.id}
                        className={`text-red-400 hover:text-red-300 ${
                          deletingUserId === user.id
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {deletingUserId === user.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirm User Deletion
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the user{" "}
              <span className="font-semibold text-white">
                {userToDelete.name || userToDelete.email}
              </span>
              ? This action cannot be undone and will permanently remove all
              associated data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-medium"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
