'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader } from '@/components/ui/loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';

export default function UserInvitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // Fetch pending invitations for current user
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('UserInvitations: Starting fetch...');
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication failed');
      }
      console.log('UserInvitations: User authenticated:', user?.email);

      // Try different API endpoints to find the correct one
      const endpoints = [
        '/api/user/invites',
        '/api/invitations',
        '/api/projects/invitations'
      ];
      
      let response = null;
      let usedEndpoint = '';
      
      for (const endpoint of endpoints) {
        try {
          console.log(`UserInvitations: Trying endpoint: ${endpoint}`);
          response = await fetch(endpoint);
          usedEndpoint = endpoint;
          
          if (response.ok) {
            console.log(`UserInvitations: Success with ${endpoint}`);
            break;
          } else {
            console.log(`UserInvitations: Failed with ${endpoint}, status: ${response.status}`);
          }
        } catch (endpointError) {
          console.log(`UserInvitations: Network error with ${endpoint}:`, endpointError);
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Failed to fetch invitations from all endpoints. Last tried: ${usedEndpoint}`);
      }

      const data = await response.json();
      console.log('UserInvitations: Received data:', data);
      setInvitations(data.invitations || []);
    } catch (err) {
      console.error('UserInvitations: Error details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation
  const acceptInvitation = async (invitation) => {
    try {
      setActionLoading(invitation.id);

      const response = await fetch(`/api/projects/${invitation.projectId}/invites/${invitation.id}`, {
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
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));

      // Redirect to the project page after successful acceptance
      if (data.project && data.project.id) {
        // Use Next.js router for client-side navigation
        window.location.href = `/projects/${data.project.id}`;
      }

    } catch (err) {
      setError(err.message);
      console.error('Error accepting invitation:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Decline invitation
  const declineInvitation = async (invitation) => {
    try {
      setActionLoading(invitation.id);

      const response = await fetch(`/api/projects/${invitation.projectId}/invites/${invitation.id}`, {
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
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));

    } catch (err) {
      setError(err.message);
      console.error('Error declining invitation:', err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

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
          <CardTitle >Project Invitations</CardTitle>
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
          <CardTitle >Project Invitations</CardTitle>
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
          <CardTitle >Project Invitations</CardTitle>
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle >Project Invitations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 p-6">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={invitation.inviter.avatar} />
                    <AvatarFallback className="bg-[#35005D] text-white">
                      {invitation.inviter.name?.charAt(0) || invitation.inviter.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {invitation.inviter.name || invitation.inviter.email}
                      </p>
                      <Badge variant={getRoleBadgeVariant(invitation.role)} className="text-xs">
                        {invitation.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Invited you to: <span className="font-medium">{invitation.project.title}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Invited on {formatDate(invitation.createdAt)}
                    </p>
                    {invitation.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        Expires on {formatDate(invitation.expiresAt)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => acceptInvitation(invitation)}
                    disabled={actionLoading === invitation.id}
                    className="bg-[#2A0049] hover:bg-[#35005D] text-white"
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
                    onClick={() => declineInvitation(invitation)}
                    disabled={actionLoading === invitation.id}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}