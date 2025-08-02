import React, { useState } from "react";
<<<<<<< HEAD
import ProjectHubCanvas from "./ProjectHubCanvas";
=======
<<<<<<< HEAD
import ProjectHubTabs from "./ProjectHubTabs";
>>>>>>> 28477e47 (fix: temporarily comment out missing ProjectHubCanvas import to resolve build errors)

=======
// import ProjectHubCanvas from "./ProjectHubCanvas";
>>>>>>> fad70e0b (fix: temporarily comment out missing ProjectHubCanvas import to resolve build errors)

const ProjectHub: React.FC = () => {
  return (
<<<<<<< HEAD
=======
<<<<<<< HEAD
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
      <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      
      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400/40 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/40 rounded-full animate-bounce"></div>
      <div className="absolute bottom-32 left-20 w-3 h-3 bg-purple-300/50 rounded-full animate-ping"></div>
      <div className="absolute bottom-20 right-10 w-5 h-5 bg-pink-300/50 rounded-full animate-pulse"></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-center">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Project Hub
          </span>
        </h1>
        <p className="text-base sm:text-lg text-gray-300 mb-8 text-center max-w-2xl">
          Sketch your ideas, upload files, and manage your creative projects
        </p>
        <ProjectHubTabs />
      </div>
=======
>>>>>>> 28477e47 (fix: temporarily comment out missing ProjectHubCanvas import to resolve build errors)
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center",
      minHeight: "100vh",
      width: "100%",
      padding: "20px 0"
    }}>
      <h2 style={{ 
        marginBottom: "20px", 
        fontSize: "clamp(1.5rem, 4vw, 2rem)",
        textAlign: "center",
        color: "#fff"
      }}>Draw and Type Your Ideas</h2>
<<<<<<< HEAD
      <ProjectHubCanvas />
=======
      {/* <ProjectHubCanvas /> */}
      <p style={{ color: "#fff", textAlign: "center" }}>
        Canvas component will be added when ProjectHubCanvas.tsx is available
      </p>
>>>>>>> fad70e0b (fix: temporarily comment out missing ProjectHubCanvas import to resolve build errors)
>>>>>>> 28477e47 (fix: temporarily comment out missing ProjectHubCanvas import to resolve build errors)
    </div>
  );
};

export default ProjectHub;
