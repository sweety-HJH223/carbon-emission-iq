'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function Navigation() {
  const pathname = usePathname()
  const { user, profile, signInWithGoogle, logout } = useAuth()

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const linkClasses = (path: string) =>
    `px-4 py-2 text-sm border-b-2 transition-colors ${
      isActive(path)
        ? 'border-[#1a3d2b] text-[#1a3d2b]'
        : 'border-transparent text-[#666] hover:text-[#1a3d2b]'
    }`

  return (
    <nav className="border-b border-[#e0e0e0] bg-white sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex gap-6">
          <Link href="/" className={linkClasses('/')}>
            Home
          </Link>
          <Link href="/calculate" className={linkClasses('/calculate')}>
            Calculate
          </Link>
          <Link href="/dashboard" className={linkClasses('/dashboard')}>
            Dashboard
          </Link>
          <Link href="/passport" className={linkClasses('/passport')}>
            Passport
          </Link>
          <Link href="/challenges" className={linkClasses('/challenges')}>
            Challenges
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#1a3d2b] leading-none">{profile?.displayName}</p>
                <button 
                    onClick={logout}
                    aria-label="Sign out"
                    className="text-xs text-[#666] hover:text-[#1a3d2b] transition-colors"
                  >
                  Sign Out
                </button>
              </div>
              {profile?.photoURL ? (
                <img 
                  src={profile.photoURL} 
                  alt={profile.displayName} 
                  className="w-10 h-10 rounded-full border border-[#e0e0e0]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#f5f0e8] flex items-center justify-center border border-[#e0e0e0]">
                  <span className="text-[#1a3d2b] font-bold">{profile?.displayName?.charAt(0)}</span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              aria-label="Sign in with Google"
              className="px-4 py-2 bg-[#1a3d2b] text-white text-sm rounded hover:bg-[#2d6a4f] transition-colors"
                >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
