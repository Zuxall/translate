/// <reference types="vite/client" />

declare module 'resumablejs' {
  export default class Resumable {
    constructor(options: any);
    addFile(file: File): void;
    upload(): void;
    on(event: string, callback: Function): void;
  }
}