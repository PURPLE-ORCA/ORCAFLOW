import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

/**
 * ProjectCard component displays project information in a card format
 * @param {Object} project - The project object containing project data
 * @param {string} project.id - Unique identifier for the project
 * @param {string} project.title - Title of the project
 * @param {string|null} project.description - Description of the project (optional)
 * @param {string} project.createdBy - User ID who created the project
 * @param {Date} project.createdAt - Date when the project was created
 * @param {Date} project.updatedAt - Date when the project was last updated
 */
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
    <Card className="hover:shadow-md transition-shadow duration-200">
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
  );
}