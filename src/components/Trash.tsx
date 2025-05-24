import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { decryptUser } from "./auth/token_secure";

interface DeletedPasswordEntry {
    deleted_at: string;
}

interface PasswordEntry {
    entry_id: string;
    account_name: string;
    username: string;
    deletion_info: DeletedPasswordEntry | null; //! Deletion metadata
}

const Trash: React.FC = () => {
    const [deletedPasswords, setDeletedPasswords] = useState<PasswordEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    //* Fetch deleted passwords function
    const fetchDeletedPasswords = async () => {
        try {
            setLoading(true);

            const user = decryptUser();
            if (!user || !user.ui) {
                throw new Error("Failed to decrypt user data or user ID is missing.");
            }

            const response = await invoke<any[]>("trash", { ui: user.ui });
            console.log("Fetched deleted passwords:", response); //! Debugging log

            const mappedPasswords: PasswordEntry[] = response.map((entry) => {
                let deletedAt: string | null = null;

                if (entry.d?.d_at?.$date?.$numberLong) {
                    const timestamp = parseInt(entry.d.d_at.$date.$numberLong, 10);
                    if (!isNaN(timestamp) && timestamp > 0 && timestamp < Number.MAX_SAFE_INTEGER) {
                        deletedAt = new Date(timestamp).toISOString();
                    }
                }

                return {
                    entry_id: entry.aid,
                    account_name: entry.an,
                    username: entry.aun,
                    deletion_info: deletedAt ? { deleted_at: deletedAt } : null,
                };
            });

            setDeletedPasswords(mappedPasswords);
        } catch (err) {
            setError("Failed to fetch deleted passwords.");
            console.error("Error fetching deleted passwords:", err);
        } finally {
            setLoading(false);
        }
    };

    //* Restore password function
    const restorePassword = async (entryId: string) => {
        const user = decryptUser();
        if (!user || !user.ui) {
            throw new Error("Failed to decrypt user data or user ID is missing.");
        }
        try {
            await invoke("restore_password", { userId: user.ui, entryId: entryId });
            setDeletedPasswords((prev) =>
                prev.filter((password) => password.entry_id !== entryId)
            );
        } catch (err) {
            setError("Failed to restore the password.");  // replace setError with alert [toaster]
            console.error("Error restoring password:", err);
        }
    };

    // Permanently delete password function
    const deletePasswordEntry = async (entryId: string) => {
        try {
            await invoke("delete_password_entry", { entryId: entryId });
            setDeletedPasswords((prev) =>
                prev.filter((password) => password.entry_id !== entryId)
            );
        } catch (err) {
            setError("Failed to permanently delete the password.");
            console.error("Error deleting password:", err);
        }
    };

    useEffect(() => {
        fetchDeletedPasswords();
    }, []);

    if (loading) return <p>Loading deleted passwords...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>Trash</h1>
            {deletedPasswords.length === 0 ? (
                <p>No deleted passwords found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Account Name</th>
                            <th>Username</th>
                            <th>Deleted At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deletedPasswords.map((password, index) => (
                            <tr key={password.entry_id || index}>
                                <td>{password.account_name}</td>
                                <td>{password.username}</td>
                                <td>
                                    {password.deletion_info?.deleted_at
                                        ? new Date(password.deletion_info.deleted_at).toLocaleString()
                                        : "Unknown"}
                                </td>
                                <td>
                                    <button onClick={() => restorePassword(password.entry_id)}>
                                        Restore
                                    </button>
                                    <button
                                        style={{ marginLeft: "0.5em", color: "red" }}
                                        onClick={() => deletePasswordEntry(password.entry_id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Trash;