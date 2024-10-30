"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Youtube,
  X,
} from "lucide-react";
import Header from "./Header";
import Image from "next/image";
import Image1 from "@/public/image.png";

// Common datacenter IP ranges (for demonstration)
const IP_RANGES = [
  { start: "154.16.0.0", end: "154.16.255.255" },
  { start: "192.241.128.0", end: "192.241.255.255" },
  { start: "46.101.0.0", end: "46.101.255.255" },
  { start: "104.236.0.0", end: "104.236.255.255" },
];

// Convert IP to numeric value for calculations
const ipToLong = (ip: string): number => {
  return (
    ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  );
};

// Convert numeric value back to IP
const longToIp = (long: number): string => {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join(".");
};

// Generate a random IP within a specific range
const generateIpInRange = (startIp: string, endIp: string): string => {
  const start = ipToLong(startIp);
  const end = ipToLong(endIp);
  const random = start + Math.floor(Math.random() * (end - start));
  return longToIp(random);
};

// Custom hook for managing proxy IPs
const useProxySystem = (count: number): string[] => {
  const [proxyList, setProxyList] = useState<string[]>([]);
  const lastRotation = useRef<number>(Date.now());
  const rotationInterval = useRef<NodeJS.Timeout | null>(null);

  // Generate unique IPs for each iframe
  const generateUniqueProxies = useCallback(() => {
    const usedRanges = new Set();
    const proxies: string[] = [];

    for (let i = 0; i < count; i++) {
      let range;
      do {
        range = IP_RANGES[Math.floor(Math.random() * IP_RANGES.length)];
      } while (usedRanges.has(range) && usedRanges.size < IP_RANGES.length);

      usedRanges.add(range);
      const ip = generateIpInRange(range.start, range.end);
      proxies.push(ip);
    }

    return proxies;
  }, [count]);

  // Rotate IPs periodically with varying intervals
  useEffect(() => {
    const setupRotation = () => {
      if (rotationInterval.current) {
        clearInterval(rotationInterval.current);
      }

      const interval =
        Math.floor(Math.random() * (60 - 30 + 1) + 30) * 60 * 1000;

      rotationInterval.current = setInterval(() => {
        const newProxies = generateUniqueProxies();
        setProxyList(newProxies);
        lastRotation.current = Date.now();
      }, interval);
    };

    setProxyList(generateUniqueProxies());
    setupRotation();

    return () => {
      if (rotationInterval.current) {
        clearInterval(rotationInterval.current);
      }
    };
  }, [generateUniqueProxies]);

  return proxyList;
};

export default function Component() {
  const [videoCount, setVideoCount] = useState(1);
  const [currentVideoId, setCurrentVideoId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [quality, setQuality] = useState("auto");
  const [videoUrl, setVideoUrl] = useState("");
  const [showAdModal, setShowAdModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [canSkip, setCanSkip] = useState(false);
  const iframeRefs = useRef<Array<HTMLIFrameElement | null>>([]);
  const playerStates = useRef<Record<number, number>>({});
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const proxyList = useProxySystem(videoCount);

  useEffect(() => {
    if (showAdModal && countdown > 0) {
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      // Enable skip button after 3 seconds
      setTimeout(() => {
        setCanSkip(true);
      }, 3000);
    }

    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [showAdModal, countdown]);

  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;

      try {
        const data = JSON.parse(event.data);
        if (data.event === "onStateChange") {
          const iframeIndex = iframeRefs.current.findIndex(
            (ref) => ref?.contentWindow === event.source
          );
          if (iframeIndex !== -1) {
            playerStates.current[iframeIndex] = data.info;

            // Update global playing state based on all players
            const anyPlaying = Object.values(playerStates.current).some(
              (state) => state === 1
            );
            setIsPlaying(anyPlaying);
          }
        }
      } catch {
        // Ignore invalid JSON
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const extractVideoId = (url: string): string => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  const createProxiedUrl = (videoId: string): string => {
    const timestamp = Date.now();
    const randomParam = Math.random().toString(36).substring(7);
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&controls=1&autoplay=0&t=${timestamp}&${randomParam}`;
  };

  const handleAddVideo = () => {
    const videoId = extractVideoId(videoUrl);
    if (videoId) {
      setShowAdModal(true);
      setCountdown(3);
      setCanSkip(false);
    }
  };

  const handleSkipAd = () => {
    setShowAdModal(false);
    setCurrentVideoId(extractVideoId(videoUrl));
    setVideoUrl("");
    setIsPlaying(false);
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
  };

  const postMessageToAllPlayers = (action: string, value?: unknown) => {
    iframeRefs.current.forEach((iframe, index) => {
      if (iframe && iframe.contentWindow) {
        setTimeout(() => {
          // Only send command if the player exists
          iframe.contentWindow?.postMessage(
            JSON.stringify({
              event: "command",
              func: action,
              args: value ? [value] : undefined,
            }),
            "*"
          );
        }, index * 50); // Reduced delay between commands
      }
    });
  };

  const togglePlayPause = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);

    // Send appropriate command to all players
    if (newIsPlaying) {
      postMessageToAllPlayers("playVideo");
    } else {
      postMessageToAllPlayers("pauseVideo");
    }
  };

  const toggleMute = () => {
    const newIsMuted = !isMuted;
    setIsMuted(newIsMuted);
    postMessageToAllPlayers(newIsMuted ? "mute" : "unMute");
  };

  const setVideoQuality = (newQuality: string) => {
    setQuality(newQuality);
    postMessageToAllPlayers("setPlaybackQuality", newQuality);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="container mx-auto p-4 dark:bg-gray-800 transition-colors duration-200">
        <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-full bg-red-600 mb-4">
              <Youtube className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 dark:text-white">
              Multi-View YouTube Player
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Watch multiple YouTube videos simultaneously with advanced
              controls
            </p>
          </div>

          {/* Control Panel */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Video Count Input */}
              <div>
                <label
                  htmlFor="videoCount"
                  className="block text-sm font-medium mb-2 dark:text-white"
                >
                  Number of Videos
                </label>
                <Input
                  type="number"
                  id="videoCount"
                  value={videoCount}
                  onChange={(e) => setVideoCount(Number(e.target.value) || 0)}
                  min="1"
                  max="30"
                  className="w-full dark:border-gray-700 dark:text-white"
                />
              </div>

              {/* URL Input */}
              <div>
                <label
                  htmlFor="videoUrl"
                  className="block text-sm font-medium mb-2 dark:text-white"
                >
                  YouTube Video URL
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddVideo}
                    className="whitespace-nowrap"
                  >
                    Set Video
                  </Button>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={togglePlayPause}
                className="min-w-[120px] transition-all"
              >
                {isPlaying ? (
                  <Pause className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isPlaying ? "Pause All" : "Play All"}
              </Button>

              <Button
                onClick={toggleMute}
                className="min-w-[120px] transition-all"
              >
                {isMuted ? (
                  <VolumeX className="mr-2 h-4 w-4" />
                ) : (
                  <Volume2 className="mr-2 h-4 w-4" />
                )}
                {isMuted ? "Unmute All" : "Mute All"}
              </Button>

              <div className="relative">
                <Button className="min-w-[120px] transition-all">
                  <Settings className="mr-2 h-4 w-4" />
                  Quality: {quality.toUpperCase()}
                  <select
                    className="absolute inset-0 opacity-0 cursor-pointer text-black"
                    value={quality}
                    onChange={(e) => setVideoQuality(e.target.value)}
                  >
                    <option value="auto">Auto</option>
                    <option value="hd1080">1080p</option>
                    <option value="hd720">720p</option>
                    <option value="large">480p</option>
                    <option value="medium">360p</option>
                    <option value="small">240p</option>
                    <option value="tiny">144p</option>
                  </select>
                </Button>
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: videoCount }).map((_, i) => (
              <div
                key={i}
                className="h-44 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg"
              >
                {currentVideoId ? (
                  <div className="relative w-full h-full">
                    <iframe
                      ref={(el) => {
                        if (iframeRefs.current) {
                          iframeRefs.current[i] = el;
                        }
                      }}
                      src={createProxiedUrl(currentVideoId) + "?autoplay=1"}
                      title={`YouTube video player ${i + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
                      IP: {proxyList[i]}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Youtube className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Add a video URL to begin
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-2xl w-full mx-4 relative">
            <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg mb-4">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">
                    Visit my TikTok profile
                  </h2>
                  <div className="w-full h-48 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-xl">
                    <a
                      href="https://www.tiktok.com/@programmer.sohail?is_from_webapp=1&sender_device=pc"
                      className="text-white hover:underline"
                    >
                      <Image
                        src={Image1}
                        alt="TikTok Profile"
                        width={600}
                        height={600}
                        className="w-full"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div
                className={`text-sm text-white dark:text-gray-300 bg-black py-1 px-2 rounded-lg ${
                  countdown > 0 ? "opacity-100" : "opacity-0"
                }`}
              >
                {countdown > 0 ? `Skip available in ${countdown}s` : ""}
              </div>
              {canSkip && (
                <Button
                  onClick={handleSkipAd}
                  className="flex items-center gap-2"
                >
                  Skip Ad <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
