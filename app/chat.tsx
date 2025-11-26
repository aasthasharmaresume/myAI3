"use client";

export default function Chat() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        backgroundColor: "#ffeccc",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 10 }}>
        Chat.tsx placeholder
      </h1>
      <p>
        This is just a placeholder component so the project can build.
        The real chat UI is in <code>app/page.tsx</code>.
      </p>
    </div>
  );
}
