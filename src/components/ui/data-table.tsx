import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, safeLower } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown, Search, X,
} from "lucide-react";

/* ─── types ─── */
export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Custom cell renderer */
  render?: (row: T, index: number) => React.ReactNode;
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Custom sort function */
  sortFn?: (a: T, b: T) => number;
  /** Hide on mobile */
  hideMobile?: boolean;
  /** Fixed width class */
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Row key extractor */
  rowKey: (row: T) => string;
  /** Searchable fields */
  searchKeys?: string[];
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Default page size */
  pageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Extra actions above table */
  actions?: React.ReactNode;
  /** Extra filters */
  filters?: React.ReactNode;
  /** Custom row className */
  rowClassName?: (row: T) => string;
}

type SortDir = "asc" | "desc" | null;

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  searchKeys = [],
  searchPlaceholder = "Search...",
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  loading = false,
  emptyMessage = "No data found",
  onRowClick,
  actions,
  filters,
  rowClassName,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>(null);

  // Reset page on search/filter change
  React.useEffect(() => setPage(0), [search, pageSize]);

  /* ─── search filter ─── */
  const filtered = React.useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      searchKeys.some(k => safeLower(row[k]).includes(q))
    );
  }, [data, search, searchKeys]);

  /* ─── sort ─── */
  const sorted = React.useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const col = columns.find(c => c.key === sortKey);
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (col?.sortFn) {
        return sortDir === "asc" ? col.sortFn(a, b) : col.sortFn(b, a);
      }
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir, columns]);

  /* ─── paginate ─── */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          {searchKeys.length > 0 && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-8 h-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {filters}
        </div>
        {actions}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.hideMobile && "hidden sm:table-cell",
                    col.sortable && "cursor-pointer select-none",
                    col.className,
                  )}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map(col => (
                    <TableCell
                      key={col.key}
                      className={cn(col.hideMobile && "hidden sm:table-cell")}
                    >
                      <div className="h-4 rounded bg-muted skeleton-shimmer" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, idx) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row),
                  )}
                >
                  {columns.map(col => (
                    <TableCell
                      key={col.key}
                      className={cn(col.hideMobile && "hidden sm:table-cell", col.className)}
                    >
                      {col.render ? col.render(row, idx) : (row[col.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[65px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(opt => (
                  <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>of {sorted.length} results</span>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(0)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">
              {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
