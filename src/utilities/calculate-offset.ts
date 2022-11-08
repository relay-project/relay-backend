export default function calculateOffset(page = 1, limit = 100): number {
  return (page - 1) * limit;
}
