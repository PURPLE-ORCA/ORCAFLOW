'use client';

import { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader } from '@/components/ui/loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ProjectInvitations({ projectId }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch pending invitations
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/invites`);

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation
  const acceptInvitation = async (invitationId) => {
    try {
      setActionLoading(invitationId);

      const response = await fetch(`/api/projects/${projectId}/invites/${invitationId}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }

      const data = await response.json();

      // Show success message
      console.log('Invitation accepted:', data.message);

      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));

    } catch (err) {
      setError(err.message);
      console.error('Error accepting invitation:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Decline invitation
  const declineInvitation = async (invitationId) => {
    try {
      setActionLoading(invitationId);

      const response = await fetch(`/api/projects/${projectId}/invites/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to decline invitation');
      }

      const data = await response.json();

      // Show success message
      console.log('Invitation declined:', data.message);

      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));

    } catch (err) {
      setError(err.message);
      console.error('Error declining invitation:', err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchInvitations();
    }
  }, [projectId]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
    return role === 'ADMIN' ? 'default' : 'secondary';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Project Invitations</CardTitle>
          <CardDescription>Manage pending project invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6" />
            <span className="ml-2 text-sm text-muted-foreground">Loading invitations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Project Invitations</CardTitle>
          <CardDescription>Manage pending project invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={fetchInvitations} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Project Invitations</CardTitle>
          <CardDescription>Manage pending project invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No pending invitations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {/* <Button variant="ghost" className="relative">
          <Bell className="h-6 w-6" />
          {invitations.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full">
              {invitations.length}
            </Badge>
          )}
        </Button> */}
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
              <DropdownMenuItem key={invitation.id} className="flex flex-col items-start space-y-2 p-4">
                <div className="flex items-center space-x-2 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={invitation.inviter.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {invitation.inviter.name?.charAt(0) || invitation.inviter.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {invitation.inviter.name || invitation.inviter.email}
                    </p>
                    <Badge variant={getRoleBadgeVariant(invitation.role)} className="text-xs">
                      {invitation.role}
                    </Badge>
                  </div>
                </div>
                <div className="w-full space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Invited you to: <span className="font-medium">{invitation.project?.title || 'Unknown Project'}</span>
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
                      acceptInvitation(invitation.id);
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
                      'Accept'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      declineInvitation(invitation.id);
                    }}
                    disabled={actionLoading === invitation.id}
                    className="h-7 px-2 text-xs flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    {actionLoading === invitation.id ? (
                      <>
                        <Loader className="h-3 w-3 mr-1" />
                        Declining...
                      </>
                    ) : (
                      'Decline'
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