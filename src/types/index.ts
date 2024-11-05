export interface ProcessOptions {
  currentPath: string;
  relativePath?: string;
  fileTypes: string[];
  singleFolder: boolean;
  sourcePath: string;
  folderName: string;
  totalFilesByType: Record<string, number>;
}

export interface FileTypeConfig {
  fileTypes: string[];
  singleFolder: boolean;
  folderName: string;
} 