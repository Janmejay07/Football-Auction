"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  Camera,
  Check,
  ChevronRight,
  Eye,
  Mic,
  Monitor,
  Palette,
  Play,
  Save,
  Shield,
  Speaker,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { playAuctionSound } from "@/hooks/useSound";
import { CLUB_OPTIONS } from "@/lib/teamFactory";

type SettingsTab = "profile" | "audio" | "camera" | "notifications" | "appearance";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { soundEnabled, toggleSound } = useUiStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile form
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [favoriteClub, setFavoriteClub] = useState(user?.favoriteClub || "");
  const [bio, setBio] = useState("");

  // Audio/Video devices state
  const [selectedMic, setSelectedMic] = useState("Default - Studio Microphone");
  const [selectedSpeaker, setSelectedSpeaker] = useState("Default - Speakers / Headphones");
  const [selectedCamera, setSelectedCamera] = useState("FaceTime HD Camera / Integrated 1080p");
  const [virtualBg, setVirtualBg] = useState("stadium");
  const [micTesting, setMicTesting] = useState(false);

  // Notification toggles
  const [notifyOutbid, setNotifyOutbid] = useState(true);
  const [notifySold, setNotifySold] = useState(true);
  const [notifyStart, setNotifyStart] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);

  // Appearance
  const [themeStyle, setThemeStyle] = useState<"stadium" | "navy">("stadium");
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      fullName,
      username,
      email,
      favoriteClub,
    });
    toast.success("Profile preferences saved successfully");
  };

  const testAudioEffect = (type: "bid" | "outbid" | "sold" | "countdown") => {
    playAuctionSound(type);
    toast.success(`Playing ${type} sound`);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Breadcrumb Header */}
      <div className="border-b border-white/5 bg-black/40 px-4 py-3 text-xs text-[var(--muted)]">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <Link href="/dashboard" className="hover:text-[var(--accent)]">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white font-medium">Settings</span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div>
          <h1 className="font-display text-4xl text-white sm:text-5xl">Preferences & Settings</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Manage your manager identity, audio/camera hardware test, and stadium notifications.
          </p>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-white/10 scrollbar-thin">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "audio", label: "Audio & Sound", icon: Volume2 },
            { id: "camera", label: "Camera & Video", icon: Camera },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "appearance", label: "Appearance", icon: Palette },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as SettingsTab)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === id
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-dim)]/30"
                  : "border-transparent text-[var(--muted)] hover:text-white hover:bg-white/[0.02]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Profile Settings */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <Card className="space-y-5">
              <CardHeader>
                <CardTitle className="text-2xl">Manager Profile</CardTitle>
                <CardDescription>Personal details visible to other room participants</CardDescription>
              </CardHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="club">Favorite Football Club</Label>
                  <select
                    id="club"
                    value={favoriteClub}
                    onChange={(e) => setFavoriteClub(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    {CLUB_OPTIONS.map((club) => (
                      <option key={club.name} value={club.name}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Manager Bio</Label>
                <textarea
                  id="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="flex w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* Tab 2: Audio Settings */}
        {activeTab === "audio" && (
          <div className="space-y-6">
            <Card className="space-y-5">
              <CardHeader>
                <CardTitle className="text-2xl">Audio Hardware & FX</CardTitle>
                <CardDescription>Configure microphone, speakers, and synthesized sound triggers</CardDescription>
              </CardHeader>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mic">Microphone Input</Label>
                  <select
                    id="mic"
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    <option value="Default - Studio Microphone">Default - Studio Microphone</option>
                    <option value="Built-in Array (Realtek Audio)">Built-in Array (Realtek Audio)</option>
                    <option value="Headset Microphone (Bluetooth)">Headset Microphone (Bluetooth)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speaker">Speaker Output</Label>
                  <select
                    id="speaker"
                    value={selectedSpeaker}
                    onChange={(e) => setSelectedSpeaker(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    <option value="Default - Speakers / Headphones">Default - Speakers / Headphones</option>
                    <option value="Realtek High Definition Audio">Realtek High Definition Audio</option>
                    <option value="External Monitor Audio">External Monitor Audio</option>
                  </select>
                </div>
              </div>

              {/* Mic Test Section */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-sm font-semibold text-white">Live Microphone Test</span>
                  </div>
                  <Button
                    size="sm"
                    variant={micTesting ? "destructive" : "secondary"}
                    onClick={() => setMicTesting(!micTesting)}
                  >
                    {micTesting ? "Stop Test" : "Test Mic Level"}
                  </Button>
                </div>

                {micTesting && (
                  <div className="space-y-1 animate-pulse">
                    <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[var(--success)] via-[var(--warning)] to-[var(--live)] w-3/4" />
                    </div>
                    <p className="text-[10px] text-[var(--success)] font-semibold">Microphone active — receiving audio signal</p>
                  </div>
                )}
              </div>

              {/* Sound FX Testing */}
              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Auction Sound Effects</h4>
                    <p className="text-xs text-[var(--muted)]">Web Audio synthesized sound cues for bids and count timer</p>
                  </div>
                  <Button
                    variant={soundEnabled ? "default" : "secondary"}
                    size="sm"
                    onClick={toggleSound}
                    className="gap-2"
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    <span>Sound {soundEnabled ? "ON" : "OFF"}</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => testAudioEffect("bid")} className="text-xs">
                    Test Bid Sound 🔨
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => testAudioEffect("outbid")} className="text-xs">
                    Test Outbid Sound ⚠️
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => testAudioEffect("sold")} className="text-xs">
                    Test Sold Sound 🎉
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => testAudioEffect("countdown")} className="text-xs">
                    Test Clock Pulse ⏱️
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 3: Camera Settings */}
        {activeTab === "camera" && (
          <div className="space-y-6">
            <Card className="space-y-5">
              <CardHeader>
                <CardTitle className="text-2xl">Camera Hardware & Preview</CardTitle>
                <CardDescription>Select video capture devices and preview your live auction presence</CardDescription>
              </CardHeader>

              <div className="space-y-2">
                <Label htmlFor="camera-select">Camera Source</Label>
                <select
                  id="camera-select"
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
                >
                  <option value="FaceTime HD Camera / Integrated 1080p">FaceTime HD Camera / Integrated 1080p</option>
                  <option value="USB HD Webcam (Wide Angle)">USB HD Webcam (Wide Angle)</option>
                  <option value="Virtual OBS Broadcast Stream">Virtual OBS Broadcast Stream</option>
                </select>
              </div>

              {/* Camera Preview Tile */}
              <div className="relative aspect-video max-w-md mx-auto overflow-hidden rounded-2xl border-2 border-[var(--accent)]/50 bg-[#09111e] shadow-2xl">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      virtualBg === "stadium"
                        ? "url(https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80)"
                        : "linear-gradient(135deg, #05070b 0%, #152033 100%)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-20 w-20 rounded-full border-2 border-[var(--accent)] bg-black/80 p-1 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80"}
                      alt="Manager"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <Badge variant="accent">Camera Ready</Badge>
                  <p className="mt-2 text-xs text-white/90 font-semibold">{user?.fullName || "Account owner"} (Host)</p>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span>1080p @ 60 FPS</span>
                  <span className="text-[var(--accent)]">Active Stream</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <Label>Virtual Background</Label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setVirtualBg("stadium")}
                    className={`rounded-xl border p-3 text-left transition ${
                      virtualBg === "stadium"
                        ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                        : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <p className="text-sm font-bold text-white">Stadium Floodlights</p>
                    <p className="text-[10px] text-[var(--muted)]">Match night atmosphere</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVirtualBg("studio")}
                    className={`rounded-xl border p-3 text-left transition ${
                      virtualBg === "studio"
                        ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                        : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <p className="text-sm font-bold text-white">Dark Broadcast Studio</p>
                    <p className="text-[10px] text-[var(--muted)]">Clean minimalist backdrop</p>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 4: Notifications Settings */}
        {activeTab === "notifications" && (
          <Card className="space-y-5">
            <CardHeader>
              <CardTitle className="text-2xl">Notification Alerts</CardTitle>
              <CardDescription>Manage real-time notifications for bids, rooms, and squad changes</CardDescription>
            </CardHeader>

            <div className="space-y-3">
              {[
                {
                  id: "outbid",
                  title: "Outbid Alert",
                  desc: "Instant audio & toast alert when a rival bidder beats your bid",
                  val: notifyOutbid,
                  set: setNotifyOutbid,
                },
                {
                  id: "sold",
                  title: "Player Sold Announcements",
                  desc: "Celebratory popup banner when you successfully purchase a player",
                  val: notifySold,
                  set: setNotifySold,
                },
                {
                  id: "start",
                  title: "Auction Start Reminders",
                  desc: "Notice when the host initiates the live bidding floor",
                  val: notifyStart,
                  set: setNotifyStart,
                },
                {
                  id: "chat",
                  title: "Chat & Mention Notifications",
                  desc: "Notify when other managers message or @mention your team",
                  val: notifyChat,
                  set: setNotifyChat,
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    item.set(!item.val);
                    toast.success(`${item.title} ${!item.val ? "enabled" : "disabled"}`);
                  }}
                  className="glass-panel flex cursor-pointer items-center justify-between rounded-xl p-4 transition hover:border-[var(--accent)]/40"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="text-xs text-[var(--muted)]">{item.desc}</p>
                  </div>
                  <div
                    className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${
                      item.val ? "bg-[var(--accent)]" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-black shadow-md transition-transform ${
                        item.val ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab 5: Appearance Settings */}
        {activeTab === "appearance" && (
          <Card className="space-y-5">
            <CardHeader>
              <CardTitle className="text-2xl">Visual Theme & Interface</CardTitle>
              <CardDescription>Customize stadium atmosphere and glass panel styling</CardDescription>
            </CardHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div
                onClick={() => {
                  setThemeStyle("stadium");
                  toast.success("Stadium Night theme active");
                }}
                className={`cursor-pointer rounded-2xl border p-5 transition ${
                  themeStyle === "stadium"
                    ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="h-20 w-full rounded-xl stadium-bg border border-white/10 mb-3" />
                <p className="font-display text-xl text-white">Stadium Night (Default)</p>
                <p className="text-xs text-[var(--muted)]">Deep stadium floodlight greens and dark navy tones.</p>
              </div>

              <div
                onClick={() => {
                  setThemeStyle("navy");
                  toast.success("Pitch Dark theme active");
                }}
                className={`cursor-pointer rounded-2xl border p-5 transition ${
                  themeStyle === "navy"
                    ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="h-20 w-full rounded-xl bg-[#04060a] border border-white/10 mb-3" />
                <p className="font-display text-xl text-white">Pitch Dark Mode</p>
                <p className="text-xs text-[var(--muted)]">Pure midnight dark theme with subtle neon accents.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
