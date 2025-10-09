'use client';

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FADE_IN_UP_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Welcome() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-6 text-foreground lg:justify-center lg:p-8">
      {/* Header with auth buttons */}
      <header className="mb-6 w-full max-w-4xl text-sm">
        <nav className="flex items-center justify-end gap-4">
          {isAuthenticated ? (
            <Link href="/projects">
              <Button variant="outline" size="sm">
                Go to Projects
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Main content */}
      <div className="flex w-full flex-col items-center justify-center px-4 opacity-100 transition-opacity duration-750 lg:grow">
        <main className="w-full max-w-3xl space-y-12 py-12 text-center text-xl lg:py-16">
          {/* Hero Section */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
            className="space-y-6"
          >
            {/* Logo and Title */}
            <motion.div variants={FADE_IN_UP_VARIANTS} className="flex flex-col items-center gap-4">
              <Link
                href="https://github.com/PURPLE-ORCA"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <div className="relative h-16 w-16 lg:h-20 lg:w-20">
                  <Image
                    src="/img/orcaLogo.png"
                    alt="ORCAFLOW Logo"
                    fill
                    className="object-contain cursor-pointer"
                    priority
                  />
                </div>
              </Link>
              <h1 className="text-4xl font-bold text-foreground lg:text-6xl">
                ORCAFLOW
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p variants={FADE_IN_UP_VARIANTS} className="text-lg text-muted-foreground lg:text-xl max-w-2xl mx-auto">
              A minimal, modern web app to help small teams manage projects, track tasks, document meetings, and collaborate — without the bloat.
            </motion.p>

            {/* Status Badge */}
            <motion.div variants={FADE_IN_UP_VARIANTS}>
              <Badge variant="outline" size="lg">
                v0.1.0 - In Development
              </Badge>
            </motion.div>
          </motion.section>

          {/* About Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-4 mt-50"
          >
            <h2 className="text-2xl font-semibold text-foreground lg:text-3xl">
              About ORCAFLOW
            </h2>
            <p className="leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Designed for small development, design, and product teams who need a simple but structured way to manage tasks, share meeting notes, and collaborate on whiteboards. Replace noisy messaging threads with a focused workspace that keeps everyone aligned.
            </p>
          </motion.section>

          {/* Features Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="space-y-4 mt-50"
          >
            <h2 className="text-2xl font-semibold text-foreground lg:text-3xl">
              Key Features
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Project Management</h3>
                <p className="text-sm text-muted-foreground">Organize work into structured projects with clear containers for tasks, notes, and meetings.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Kanban Boards</h3>
                <p className="text-sm text-muted-foreground">Visual task management with drag-and-drop functionality across Todo, Doing, and Done columns.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Team Collaboration</h3>
                <p className="text-sm text-muted-foreground">Invite team members, assign tasks, and track progress together in real-time.</p>
              </div>
              {/* <div className="space-y-2">
                <h3 className="font-medium text-foreground">Meeting Documentation</h3>
                <p className="text-sm text-muted-foreground">Schedule meetings, take notes, and embed whiteboards for visual collaboration.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Markdown Notes</h3>
                <p className="text-sm text-muted-foreground">Rich text editing for documentation, ideas, and meeting follow-ups.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Dark & Light Mode</h3>
                <p className="text-sm text-muted-foreground">Beautiful interface that adapts to your preferred theme and reduces eye strain.</p>
              </div> */}
            </div>
          </motion.section>

          {/* Call to Action */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="space-y-4 mt-50"
            >
              <p className="text-muted-foreground">
                Ready to streamline your team's workflow?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signin">
                  <Button size="lg" variant="primary">
                    Get Started
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline">
                    Create Account
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <Link href="/projects">
                <Button size="lg" variant="primary">
                  Go to Your Projects
                </Button>
              </Link>
            </motion.div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ORCAFLOW. All rights reserved.
      </footer>
    </div>
  );
}
