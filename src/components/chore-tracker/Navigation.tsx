"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckCircle, Plus, LogOut, TrendingUp, Moon, Sun, ArrowLeft, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { logoutAction } from "@/lib/actions/user-actions"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

import type { User } from "@/lib/db/types"

interface NavigationProps {
  user?: User | null
  showBackButton?: boolean
}

export function Navigation({ user, showBackButton = false }: NavigationProps) {
  const { setTheme, theme } = useTheme()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure theme is mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayUser = user ? {
    name: user.name,
    email: user.email,
    initials: getInitials(user.name)
  } : {
    name: "Guest User",
    email: "guest@example.com", 
    initials: "GU"
  }

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    // Theme persistence is handled by next-themes automatically
  }

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: CheckCircle },
    { href: "/log-chore", label: "Log Chore", icon: Plus },
    { href: "/trends", label: "Trends & Analytics", icon: TrendingUp },
  ]

  return (
    <>
      <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              {showBackButton || pathname === '/log-chore' ? (
                <Link 
                  href="/" 
                  className="flex items-center hover:opacity-80 transition-opacity touch-manipulation"
                  aria-label="Go back to dashboard"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  <CheckCircle className="h-8 w-8 text-primary" />
                  <span className="ml-2 text-xl font-semibold text-foreground hidden sm:inline">Who Vacuumed</span>
                </Link>
              ) : (
                <Link 
                  href="/" 
                  className="flex items-center hover:opacity-80 transition-opacity touch-manipulation"
                  aria-label="Who Vacuumed - Home"
                >
                  <CheckCircle className="h-8 w-8 text-primary" />
                  <span className="ml-2 text-xl font-semibold text-foreground hidden sm:inline">Who Vacuumed</span>
                </Link>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/log-chore">
                <Button className="touch-manipulation">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Chore
                </Button>
              </Link>
              
              {/* Theme Toggle Button - Desktop */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="touch-manipulation"
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* User Profile Dropdown - Desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 hover:bg-muted touch-manipulation"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">{displayUser.initials}</span>
                    </div>
                    <span className="text-sm text-foreground hidden lg:inline">{displayUser.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center space-x-2 p-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">{displayUser.initials}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{displayUser.name}</span>
                      <span className="text-xs text-muted-foreground">{displayUser.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/trends">
                    <DropdownMenuItem className="touch-manipulation">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Trends & Analytics
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive touch-manipulation" asChild>
                    <form action={logoutAction}>
                      <button type="submit" className="flex items-center w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Theme Toggle - Mobile */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="touch-manipulation"
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="touch-manipulation"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-t border-border">
              {/* User Profile Section - Mobile */}
              <div className="flex items-center space-x-3 px-3 py-3 border-b border-border">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">{displayUser.initials}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{displayUser.name}</span>
                  <span className="text-xs text-muted-foreground">{displayUser.email}</span>
                </div>
              </div>

              {/* Navigation Items - Mobile */}
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-3 text-base font-medium rounded-md touch-manipulation transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary border-l-4 border-primary'
                        : 'text-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {Icon && <Icon className="h-5 w-5 mr-3" />}
                    {item.label}
                  </Link>
                )
              })}

              {/* Logout Button - Mobile */}
              <form action={logoutAction} className="px-3 py-2">
                <button
                  type="submit"
                  className="flex items-center w-full px-3 py-3 text-base font-medium text-destructive hover:bg-destructive/10 rounded-md touch-manipulation transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}