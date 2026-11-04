declare module 'virtual:guide' {
  const guide: {
    html: string;
    headings: { id: string; text: string; depth: number }[];
  };
  export default guide;
}
