"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Moon,
  Sun,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react";

// Common datacenter IP ranges (for demonstration)
const IP_RANGES = [
  { start: "154.16.0.0", end: "154.16.255.255" }, // DataCenter Range 1
  { start: "192.241.128.0", end: "192.241.255.255" }, // DataCenter Range 2
  { start: "46.101.0.0", end: "46.101.255.255" }, // DataCenter Range 3
  { start: "104.236.0.0", end: "104.236.255.255" }, // DataCenter Range 4
];

// Convert IP to numeric value for calculations
const ipToLong = (ip: string) => {
  return (
    ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  );
};

// Convert numeric value back to IP
const longToIp = (long: number) => {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join(".");
};

// Generate a random IP within a specific range
const generateIpInRange = (startIp: string, endIp: string) => {
  const start = ipToLong(startIp);
  const end = ipToLong(endIp);
  const random = start + Math.floor(Math.random() * (end - start));
  return longToIp(random);
};

// Custom hook for managing proxy IPs
const useProxySystem = (count: number) => {
  const [proxyList, setProxyList] = useState<string[]>([]);
  const lastRotation = useRef<number>(Date.now());
  const rotationInterval = useRef<NodeJS.Timeout | null>(null);

  // Generate unique IPs for each iframe
  const generateUniqueProxies = () => {
    const usedRanges = new Set();
    const proxies = [];

    for (let i = 0; i < count; i++) {
      let range;
      // Ensure each iframe uses a different IP range
      do {
        range = IP_RANGES[Math.floor(Math.random() * IP_RANGES.length)];
      } while (usedRanges.has(range) && usedRanges.size < IP_RANGES.length);

      usedRanges.add(range);
      const ip = generateIpInRange(range.start, range.end);
      proxies.push(ip);
    }

    return proxies;
  };

  // Rotate IPs periodically with varying intervals
  useEffect(() => {
    const setupRotation = () => {
      if (rotationInterval.current) {
        clearInterval(rotationInterval.current);
      }

      // Random interval between 30-60 minutes
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
  }, [count]);

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
  const iframeRefs = useRef<Array<HTMLIFrameElement | null>>([]);
  const playerStates = useRef<{ [key: number]: number }>({});

  // Use our custom proxy system
  const proxyList = useProxySystem(videoCount);

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
          }
        }
      } catch (e) {
        // Ignore invalid JSON
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const extractVideoId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  // Enhanced proxy URL creation with additional parameters
  const createProxiedUrl = (videoId: string, proxyIP: string) => {
    const timestamp = Date.now();
    const randomParam = Math.random().toString(36).substring(7);
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&controls=1&autoplay=0&t=${timestamp}&${randomParam}`;
  };

  const handleAddVideo = () => {
    const videoId = extractVideoId(videoUrl);
    if (videoId) {
      setCurrentVideoId(videoId);
      setVideoUrl("");
      setIsPlaying(false);
    }
  };

  const postMessageToAllPlayers = (action: string, value?: any) => {
    iframeRefs.current.forEach((iframe, index) => {
      if (iframe && iframe.contentWindow) {
        // Add small random delay for each iframe to make it look more natural
        setTimeout(() => {
          iframe.contentWindow?.postMessage(
            JSON.stringify({
              event: "command",
              func: action,
              args: value ? [value] : undefined,
            }),
            "*"
          );
        }, Math.random() * 100); // Random delay up to 100ms
      }
    });
  };

  const togglePlayPause = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    postMessageToAllPlayers(newIsPlaying ? "playVideo" : "pauseVideo");
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">
            YouTube Video Grid with Advanced IP Rotation
          </h1>
          <Button
            onClick={() => setIsDarkMode(!isDarkMode)}
            variant="outline"
            size="icon"
          >
            {isDarkMode ? (
              <Sun className="h-[1.2rem] w-[1.2rem] text-white" />
            ) : (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>
        </div>

        <div className="mb-4">
          <label htmlFor="videoCount" className="block mb-2 dark:text-white">
            Number of Videos:
          </label>
          <Input
            type="number"
            id="videoCount"
            value={videoCount}
            onChange={(event) =>
              setVideoCount(parseInt(event.target.value, 10))
            }
            min="1"
            max="30"
            className="w-full max-w-xs dark:text-white text-black"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="videoUrl" className="block mb-2 dark:text-white">
            Add YouTube Video URL:
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
            <Button onClick={handleAddVideo}>Set Video</Button>
          </div>
        </div>

        <div className="mb-4 space-x-2">
          <Button onClick={togglePlayPause}>
            {isPlaying ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isPlaying ? "Pause All" : "Play All"}
          </Button>

          <Button onClick={toggleMute}>
            {isMuted ? (
              <VolumeX className="mr-2 h-4 w-4" />
            ) : (
              <Volume2 className="mr-2 h-4 w-4" />
            )}
            {isMuted ? "Unmute All" : "Mute All"}
          </Button>

          <div className="inline-block relative">
            <Button className="inline-flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Quality: {quality.toUpperCase()}
              <select
                className="absolute inset-0 opacity-0 cursor-pointer"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: videoCount }).map((_, index: number) => (
            <div key={index} className="aspect-w-16 aspect-h-9">
              {currentVideoId ? (
                <div className="relative">
                  <iframe
                    ref={(el) => (iframeRefs.current[index] = el)}
                    src={createProxiedUrl(currentVideoId, proxyList[index])}
                    title={`YouTube video player ${index + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                  />
                  <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
                    IP: {proxyList[index]}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Add a video URL
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
