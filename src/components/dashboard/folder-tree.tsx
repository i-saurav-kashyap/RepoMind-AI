"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Folder, FolderOpen, File as FileIcon } from "lucide-react";
import type { FileNode } from "@/types/analysis";

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children: Map<string, TreeNode>;
}

function buildTree(files: FileNode[]): TreeNode {
  const root: TreeNode = { name: "", path: "", type: "dir", children: new Map() };
  for (const f of files) {
    const parts = f.path.split("/");
    let node = root;
    parts.forEach((part, i) => {
      const isLeaf = i === parts.length - 1;
      if (!node.children.has(part)) {
        node.children.set(part, {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          type: isLeaf && f.type === "file" ? "file" : "dir",
          children: new Map(),
        });
      }
      node = node.children.get(part)!;
    });
  }
  return root;
}

function sortChildren(node: TreeNode): TreeNode[] {
  return [...node.children.values()].sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function TreeRow({ node, depth }: { node: TreeNode; depth: number }) {
  // Open the first two levels by default.
  const [open, setOpen] = useState(depth < 1);
  const children = useMemo(() => sortChildren(node), [node]);
  const isDir = node.type === "dir";

  return (
    <div>
      <button
        onClick={() => isDir && setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm hover:bg-surface-2"
        style={{ paddingLeft: depth * 14 + 6 }}
      >
        {isDir ? (
          <>
            <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted transition ${open ? "rotate-90" : ""}`} />
            {open ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-accent" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-accent/80" />
            )}
            <span className="text-fg/90">{node.name}</span>
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <FileIcon className="h-4 w-4 shrink-0 text-muted" />
            <span className="font-mono text-fg/70">{node.name}</span>
          </>
        )}
      </button>
      {isDir && open && children.map((c) => <TreeRow key={c.path} node={c} depth={depth + 1} />)}
    </div>
  );
}

export function FolderTree({ files }: { files: FileNode[] }) {
  const root = useMemo(() => buildTree(files), [files]);
  const top = useMemo(() => sortChildren(root), [root]);
  return (
    <div className="max-h-[560px] overflow-auto rounded-lg border border-border bg-surface-2/40 p-2">
      {top.map((c) => (
        <TreeRow key={c.path} node={c} depth={0} />
      ))}
    </div>
  );
}
