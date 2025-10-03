import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ProjectCard({ project }) {
  // Format the date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            {project.title}
          </CardTitle>
          {project.description && (
            <CardDescription className="text-muted-foreground">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Created {formatDate(project.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}