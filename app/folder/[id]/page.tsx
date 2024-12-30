"use client";

import { AddContentFolderModal } from "@/components/add-content-folder";
import { NoteCard } from "@/components/note-card";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import folderInterface from "@/interface/folder_interface";
import { authClient } from "@/lib/auth-client";
import useSingleFoldersStore from "@/state/singleFolderStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { Bookmark, Loader, MoveLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
// import { Toaster, toast } from "@/components/ui/toaster";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Edit, Trash } from "lucide-react";

export default function Folder({ params }: { params: { id: string } }) {
  const id = params.id;
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { singleFolder, setSingleFolder } = useSingleFoldersStore();
  const session = authClient.useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (singleFolder) {
      setNewFolderName(singleFolder.name);
    }
  }, [singleFolder]);

  const handleEditFolder = async () => {
    if (!newFolderName) {
      toast.error("Please enter a folder name");
      return;
    }
    try {
      await axios.patch(
        `/api/v1/folder/${id}`,
        { name: newFolderName },
        { withCredentials: true }
      );
      toast.success("Folder updated successfully!");
      setIsEditModalOpen(false);
      queryClient.invalidateQueries();
    } catch (error) {
      console.error("Failed to update folder:", error);
      toast.error("Failed to update folder. Please try again.");
    }
  };

  const handleDeleteFolder = async () => {
    try {
      await axios.delete(`/api/v1/folder/${id}`, { withCredentials: true });
      toast.success("Folder deleted successfully!");
      setIsDeleteModalOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error("Failed to delete folder. Please try again.");
    }
  };

  const user = {
    name: session.data?.user ? (session.data?.user.name as string) : "",
    email: session.data?.user ? (session.data?.user.email as string) : "",
    image: session.data?.user ? (session.data?.user.image as string) : "",
  };

  const { isLoading, isError, error } = useQuery({
    queryKey: ["repoData", id],
    queryFn: async () => {
      const response = (await axios.get(`/api/v1/folder/${id}`, {
        withCredentials: true,
      })) as {
        data: { data: folderInterface };
      };
      setSingleFolder(response.data.data);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
    retry: 1,
    // onError: (err) => {
    //   console.error("Error fetching folder:", err);
    //   toast.error(err);
    // },
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin" />
        </div>
      );
    }

    if (isError) {
      return (
        <Card className="p-4">
          <p className="text-red-500">
            Error loading data: {(error as Error).message}
          </p>
        </Card>
      );
    }

    if (!singleFolder?.content || singleFolder.content.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="empty-state text-center p-8"
        >
          <p className="text-xl text-gray-500">
            No bookmarks found. Add some to get started!
          </p>
          <Button
            onClick={() => setIsAddContentModalOpen(true)}
            className="mt-4"
          >
            Add Your First Bookmark
          </Button>
        </motion.div>
      );
    }

    return (
      <motion.div
        key="bookmarks"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bookmarks-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {singleFolder.content.map((bookmark) => (
          <NoteCard
            id={bookmark.id}
            key={bookmark.id}
            title={bookmark.title}
            description={(bookmark.description as string) || ""}
            link={bookmark.link}
            tags={bookmark.tags}
            type={bookmark.type}
          />
        ))}
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto mt-5 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
          <Bookmark className="w-8 h-8 mr-2" />
          Bookmarks
        </h1>

        <div className="flex items-center space-x-3">
          <ProfileDropdown user={user} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center my-5 gap-4">
        <div className="flex items-center gap-5">
          <Button
            onClick={() => router.back()}
            className="bg-transparent shadow-none hover:bg-gray-100 transition-colors"
          >
            <MoveLeftIcon className="text-black text-xl font-bold" />
          </Button>
          <h2 className="text-2xl font-semibold">
            {singleFolder?.name || "Loading..."} Folder
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddContentModalOpen(true)}>
            Add Content
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className=" border-black/20  ">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className=" outline-none hover:outline-none hover:cursor-pointer bg-white py-2 px-3 border border-black/10 rounded-l-md rounded-br-md mr-4 mt-2  "
            >
              <DropdownMenuItem
                onClick={() => setIsEditModalOpen(true)}
                className=" flex gap-2 items-center hover:bg-slate-100 p-2 rounded-md outline-none hover:outline-none hover:cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Folder</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-red-600 flex items-center gap-2 hover:bg-slate-100 rounded-md p-2  outline-none hover:outline-none hover:cursor-pointer"
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete Folder</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>{renderContent()}</div>

      <AddContentFolderModal
        isOpen={isAddContentModalOpen}
        onClose={() => setIsAddContentModalOpen(false)}
      />

      {/* Edit Folder Modal */}
      <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed bg-white p-6 shadow-lg rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Edit Folder
            </Dialog.Title>
            <Dialog.Description className="text-gray-500 mb-4">
              Enter a new name for the folder.
            </Dialog.Description>
            <input
              className="border p-2 rounded w-full mb-4"
              placeholder="Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="secondary">Cancel</Button>
              </Dialog.Close>
              <Button onClick={handleEditFolder}>Save</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Folder Modal */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed bg-white p-6 shadow-lg rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Delete Folder
            </Dialog.Title>
            <Dialog.Description className="text-gray-500 mb-4">
              Are you sure you want to delete the folder `{singleFolder?.name}`?
              This action cannot be undone.
            </Dialog.Description>
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="secondary">Cancel</Button>
              </Dialog.Close>
              <Button variant="destructive" onClick={handleDeleteFolder}>
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}