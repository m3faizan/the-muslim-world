import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center geometric-bg px-6 text-center">
      <div className="font-arabic text-6xl text-primary/40 mb-4">٤٠٤</div>
      <h1 className="text-4xl font-bold text-foreground mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-2 font-arabic text-lg" dir="rtl">
        لم يتم العثور على الصفحة
      </p>
      <p className="text-muted-foreground max-w-md mb-8">
        The path you seek does not exist in this journey. Return to the beginning and explore the world of Islamic heritage.
      </p>
      <Link href="/">
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
          Return Home
        </button>
      </Link>
    </div>
  );
}
