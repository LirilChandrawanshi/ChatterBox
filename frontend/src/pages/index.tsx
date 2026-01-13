import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MessageCircle } from "lucide-react";

export default function Home() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      router.push(`/chat?username=${encodeURIComponent(username.trim())}`);
    }
  };

  return (
    <>
      <Head>
        <title>ChatterBox - Connect & Chat</title>
      </Head>

      <div className="flex items-center justify-center min-h-screen w-full p-4 bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl w-full max-w-md p-8 border border-gray-200 dark:border-gray-700 transform transition-all hover:scale-105">
          <div className="flex items-center justify-center mb-6">
            <MessageCircle className="w-10 h-10 mr-3 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              ChatterBox
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className=" text-black">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition"
                required
                minLength={2}
                maxLength={50}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition transform hover:scale-105 font-semibold shadow-lg"
            >
              Start Chatting
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
