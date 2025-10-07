"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function UserInvitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch pending invitations for current user
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("UserInvitations: Starting fetch...");

      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth error:", authError);
        throw new Error("Authentication failed");
      }
      console.log("UserInvitations: User authenticated:", user?.email);

      // Try different API endpoints to find the correct one
      const endpoints = ["/api/user/invites"];

      let response = null;
      let usedEndpoint = "";

      for (const endpoint of endpoints) {
        try {
          console.log(`UserInvitations: Trying endpoint: ${endpoint}`);

          // Add diagnostic logging for authentication
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();
          console.log("UserInvitations: Session check:", {
            hasSession: !!session,
            error: sessionError?.message,
            userEmail: session?.user?.email,
          });

          // Add authentication headers to the request
          const headers = {
            "Content-Type": "application/json",
          };

          // Add Authorization header if session exists
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
            console.log("UserInvitations: Added Authorization header");
          }

          response = await fetch(endpoint, { headers });
          usedEndpoint = endpoint;

          console.log(`UserInvitations: Response status: ${response.status}`);

          if (response.ok) {
            console.log(`UserInvitations: Success with ${endpoint}`);
            break;
          } else {
            const errorText = await response.text();
            console.log(
              `UserInvitations: Failed with ${endpoint}, status: ${response.status}, response: ${errorText}`
            );
          }
        } catch (endpointError) {
          console.log(
            `UserInvitations: Network error with ${endpoint}:`,
            endpointError
          );
        }
      }

      if (!response || !response.ok) {
        throw new Error(
          `Failed to fetch invitations from all endpoints. Last tried: ${usedEndpoint}`
        );
      }

      const data = await response.json();
      console.log("UserInvitations: Received data:", data);
      setInvitations(data.invitations || []);
    } catch (err) {
      console.error("UserInvitations: Error details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation
  const acceptInvitation = async (invitation) => {
    try {
      setActionLoading(invitation.id);

      // Get session for Authorization header
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error("Authentication failed");
      }

      // Add authentication headers to the request
      const headers = {
        "Content-Type": "application/json",
      };

      // Add Authorization header if session exists
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `/api/projects/${invitation.projectId}/invites/${invitation.id}`,
        {
          method: "PUT",
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }

      const data = await response.json();

      // Show success message
      console.log("Invitation accepted:", data.message);

      // Remove the invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));

      // Redirect to the project page after successful acceptance
      if (data.project && data.project.id) {
        // Use Next.js router for client-side navigation
        window.location.href = `/projects/${data.project.id}`;
      }
    } catch (err) {
      setError(err.message);
      console.error("Error accepting invitation:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Decline invitation
  const declineInvitation = async (invitation) => {
    try {
      setActionLoading(invitation.id);

      // Get session for Authorization header
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error("Authentication failed");
      }

      // Add authentication headers to the request
      const headers = {
        "Content-Type": "application/json",
      };

      // Add Authorization header if session exists
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `/api/projects/${invitation.projectId}/invites/${invitation.id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to decline invitation");
      }

      const data = await response.json();

      // Show success message
      console.log("Invitation declined:", data.message);

      // Remove the invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
    } catch (err) {
      setError(err.message);
      console.error("Error declining invitation:", err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
    return role === "ADMIN" ? "default" : "secondary";
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="md"
          className="relative p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
        >
          <Bell className="w-8 h-8" />
          {invitations.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center p-0 rounded-full">
              {invitations.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Project Invitations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader className="h-4 w-4 mr-2" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : invitations.length > 0 ? (
          <>
            {invitations.map((invitation) => (
              <DropdownMenuItem
                key={invitation.id}
                className="flex flex-col items-start space-y-2 p-4"
              >
                <div className="flex items-center space-x-2 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={invitation.inviter.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {invitation.inviter.name?.charAt(0) ||
                        invitation.inviter.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {invitation.inviter.name || invitation.inviter.email}
                    </p>
                  </div>
                </div>
                <div className="w-full space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Invited you to:{" "}
                    <span className="font-medium">
                      {invitation.project.title}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(invitation.createdAt)}
                  </p>
                  {invitation.expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {formatDate(invitation.expiresAt)}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 w-full mt-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptInvitation(invitation);
                    }}
                    disabled={actionLoading === invitation.id}
                    className="h-7 px-2 text-xs flex-1"
                  >
                    {actionLoading === invitation.id ? (
                      <>
                        <Loader className="h-3 w-3 mr-1" />
                        Accepting...
                      </>
                    ) : (
                      "Accept"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      declineInvitation(invitation);
                    }}
                    disabled={actionLoading === invitation.id}
                    className="h-7 px-2 text-xs flex-1 border-destructive text-destructive hover:bg-destructive hover:text-primary-foreground"
                  >
                    {actionLoading === invitation.id ? (
                      <>
                        <Loader className="h-3 w-3 mr-1" />
                        Declining...
                      </>
                    ) : (
                      "Decline"
                    )}
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <DropdownMenuItem>No pending invitations</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
