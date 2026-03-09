import EnvTest from "./components/EnvTest";
import MapView from "./components/MapView";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-black">
      
      {/* ENV DEBUG (temporary — remove later) */}
      <EnvTest />

      {/* Fullscreen GPS Map */}
      <MapView />

    </div>
  );
}