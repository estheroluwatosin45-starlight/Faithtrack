"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Church, LayoutDashboard, Calendar, Users, FileText, Menu, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { db } from '../lib/db';

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const updateState = useCallback(() => {
    setIsOffline(db.isOfflineMode());
    const studentsPending = db.getOfflineStudents().length;
    const attendancePending = db.getOfflineAttendance().length;
    setPendingCount(studentsPending + attendancePending);
  }, []);

  const autoSync = useCallback(async () => {
    if (isSyncing) return;
    const isModeOffline = db.isOfflineMode();
    const studentsPending = db.getOfflineStudents().length;
    const attendancePending = db.getOfflineAttendance().length;
    const pending = studentsPending + attendancePending;

    if (!isModeOffline && pending > 0) {
      setIsSyncing(true);
      try {
        console.log(`Auto-syncing ${pending} offline records...`);
        const res = await db.syncOfflineData();
        if (res.success) {
          console.log('Auto-sync completed successfully!');
          window.location.reload();
        }
      } catch (err) {
        console.error('Auto-sync failed:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [isSyncing]);

  useEffect(() => {
    updateState();
    autoSync();

    const handleNetworkChange = () => {
      updateState();
      autoSync();
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    window.addEventListener('storage', handleNetworkChange);

    const interval = setInterval(handleNetworkChange, 5000);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('storage', handleNetworkChange);
      clearInterval(interval);
    };
  }, [updateState, autoSync]);

  const handleToggleOffline = () => {
    const currentMode = db.isOfflineMode();
    db.setOfflineMode(!currentMode);
    updateState();
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await db.syncOfflineData();
      if (res.success) {
        alert(`Successfully synced data!\nStudents Synced: ${res.studentsSynced}\nAttendance Logs Synced: ${res.attendanceSynced}`);
        window.location.reload();
      }
    } catch (err: any) {
      alert(`Sync failed: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
      updateState();
    }
  };

  const mainLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const checkinLinks = [
    { name: 'School', path: '/school' },
    { name: 'Devotion', path: '/devotion' },
    { name: 'Chapel', path: '/chapel' },
  ];

  const recordLinks = [
    { name: 'School', path: '/records/school' },
    { name: 'Devotion', path: '/records/devotion' },
    { name: 'Chapel', path: '/records/chapel' },
  ];

  return (
    <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <nav className="border border-white/50 bg-white/50 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Church className="h-6 w-6" />
              </div>
              <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
                Vessel of His Mercy
              </Link>
            </div>
            
            {/* Desktop Main Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {mainLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === link.path ? 'bg-blue-600/10 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-white/60 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Sub Links */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex flex-col items-end border-l border-gray-200 pl-4 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 w-16 text-right">Check In</span>
                  <div className="flex space-x-1">
                    {checkinLinks.map((link) => (
                      <Link
                        key={link.path}
                        href={link.path}
                        className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                          pathname === link.path ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 w-16 text-right">Records</span>
                  <div className="flex space-x-1">
                    {recordLinks.map((link) => (
                      <Link
                        key={link.path}
                        href={link.path}
                        className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                          pathname === link.path ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Online/Offline status and Sync actions */}
              <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                {/* Sync Button */}
                {pendingCount > 0 && (
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all duration-200 animate-pulse disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync ({pendingCount})
                  </button>
                )}

                {/* Status Toggle */}
                <button
                  onClick={handleToggleOffline}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                    isOffline
                      ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                  title={isOffline ? 'You are working offline. Click to go online.' : 'You are working online. Click to go offline.'}
                >
                  <span className={`h-2 w-2 rounded-full ${isOffline ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                  {isOffline ? (
                    <>
                      <WifiOff className="h-3.5 w-3.5" />
                      Offline
                    </>
                  ) : (
                    <>
                      <Wifi className="h-3.5 w-3.5" />
                      Online
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Status Dot & Sync */}
            <div className="flex lg:hidden items-center mr-2">
              {pendingCount > 0 && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white shadow-sm transition-colors cursor-pointer animate-pulse mr-2"
                  title={`Sync ${pendingCount} pending records`}
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="text-[10px]">{pendingCount}</span>
                </button>
              )}
              <button
                onClick={handleToggleOffline}
                className={`flex items-center p-2 rounded-lg border transition-colors cursor-pointer ${
                  isOffline
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-green-200 bg-green-50 text-green-700'
                }`}
                title={isOffline ? 'Offline Mode. Tap to go Online.' : 'Online Mode. Tap to go Offline.'}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${isOffline ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors cursor-pointer"
                aria-label="Toggle Menu"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {isOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-6 space-y-6">
            {/* Connection Status & Sync for Mobile */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isOffline ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                <span className="text-sm font-semibold text-gray-700">
                  {isOffline ? 'Offline Mode' : 'Online Mode'}
                </span>
              </div>
              
              <div className="flex gap-2">
                {pendingCount > 0 && (
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync ({pendingCount})
                  </button>
                )}
                <button
                  onClick={handleToggleOffline}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    isOffline
                      ? 'border-red-200 bg-white text-red-700 hover:bg-red-50'
                      : 'border-green-200 bg-white text-green-700 hover:bg-green-50'
                  }`}
                >
                  {isOffline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isOffline ? 'Go Online' : 'Go Offline'}
                </button>
              </div>
            </div>

            {/* Main Links */}
            <div className="space-y-1">
              <div className="text-xs font-bold tracking-wider uppercase text-gray-400 px-3 mb-2">Main Navigation</div>
              {mainLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      pathname === link.path ? 'bg-blue-600/10 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Check Ins */}
            <div className="space-y-2">
              <div className="text-xs font-bold tracking-wider uppercase text-gray-400 px-3 mb-2">Check In Sessions</div>
              <div className="grid grid-cols-3 gap-2 px-3">
                {checkinLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-center text-xs font-medium py-2 rounded-lg transition-colors ${
                      pathname === link.path ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Records */}
            <div className="space-y-2">
              <div className="text-xs font-bold tracking-wider uppercase text-gray-400 px-3 mb-2">Attendance Records</div>
              <div className="grid grid-cols-3 gap-2 px-3">
                {recordLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-center text-xs font-medium py-2 rounded-lg transition-colors ${
                      pathname === link.path ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/school' || pathname === '/devotion' || pathname === '/chapel';
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => console.log('Service Worker registered successfully:', reg.scope),
        (err) => console.error('Service Worker registration failed:', err)
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex flex-col font-sans">
      <Navbar />
      <main className={`flex-1 ${!isHome ? 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full' : ''}`}>
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Vessel of His Mercy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
