import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { AdminPageHeader, AdminPanel, DataTable, StatCard, type Column } from "@/components/admin/kit";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/nav";
import { RoleSelect, UserStatusForm } from "@/components/admin/customer-controls";
import { all, get } from "@/lib/db";
import { intParam } from "@/lib/params";
import { formatCompactPrice, formatDate, initials } from "@/lib/format";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatarColor: string;
  createdAt: string;
  orderCount: number;
  spend: number;
  addressCount: number;
}

const PER_PAGE = 20;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const page = intParam(params.page, 1, { min: 1, max: 10_000 });
  const role = params.role ?? "ALL";

  const conditions: string[] = [];
  const queryParams: unknown[] = [];

  if (params.q) {
    conditions.push("(LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)");
    const like = `%${params.q.toLowerCase()}%`;
    queryParams.push(like, like);
  }
  if (role !== "ALL") {
    conditions.push("u.role = ?");
    queryParams.push(role);
  }

  const clause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = Number(get<{ total: number }>(`SELECT COUNT(*) AS total FROM users u ${clause}`, queryParams)?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const customers: CustomerRow[] = all(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.avatar_color, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
            COALESCE((SELECT SUM(o.total) FROM orders o
                       WHERE o.user_id = u.id AND o.status NOT IN ('CANCELLED','REFUNDED')), 0) AS spend,
            (SELECT COUNT(*) FROM addresses a WHERE a.user_id = u.id) AS address_count
       FROM users u ${clause}
      ORDER BY spend DESC, u.created_at DESC
      LIMIT ? OFFSET ?`,
    [...queryParams, PER_PAGE, (page - 1) * PER_PAGE],
  ).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: (row.phone as string | null) ?? null,
    role: String(row.role),
    status: String(row.status),
    avatarColor: String(row.avatar_color ?? "#0a57a0"),
    createdAt: String(row.created_at),
    orderCount: Number(row.order_count ?? 0),
    spend: Number(row.spend ?? 0),
    addressCount: Number(row.address_count ?? 0),
  }));

  const counts = all(
    "SELECT role, COUNT(*) AS total FROM users GROUP BY role",
  ).reduce<Record<string, number>>((acc, row) => {
    acc[String(row.role)] = Number(row.total);
    return acc;
  }, {});

  const topSpend = customers.reduce((max, customer) => Math.max(max, customer.spend), 1);

  const columns: Array<Column<CustomerRow>> = [
    {
      key: "customer",
      header: "Customer",
      cell: (row) => (
        <span className="flex items-center gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full text-[0.75rem] font-bold text-white"
            style={{ backgroundColor: row.avatarColor }}
            aria-hidden
          >
            {initials(row.name)}
          </span>
          <span className="min-w-0">
            <Link
              href={`/admin/customers/${row.id}`}
              className="block text-[0.84rem] font-medium text-ink-900 hover:text-brand-700"
            >
              {row.name}
            </Link>
            <span className="block text-[0.72rem] text-ink-500">{row.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => <RoleSelect userId={row.id} role={row.role} />,
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      cell: (row) => <span className="text-ink-700">{row.orderCount}</span>,
    },
    {
      key: "spend",
      header: "Lifetime spend",
      align: "right",
      cell: (row) => (
        <span className="block">
          <span className="block font-semibold text-ink-900">{formatCompactPrice(row.spend)}</span>
          <span className="mt-0.5 block h-1 w-16 overflow-hidden rounded-full bg-ink-100">
            <span
              className="block h-full rounded-full bg-brand-600"
              style={{ width: `${Math.min(100, (row.spend / topSpend) * 100)}%` }}
            />
          </span>
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      align: "right",
      hideBelow: "lg",
      cell: (row) => <span className="text-[0.78rem] text-ink-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: (row) => (
        <span className="flex flex-col items-end gap-1.5">
          <Badge tone={row.status === "ACTIVE" ? "brand" : "rose"}>{row.status === "ACTIVE" ? "Active" : "Suspended"}</Badge>
          <UserStatusForm userId={row.id} status={row.status} />
        </span>
      ),
    },
  ];

  const hrefTemplate = `/admin/customers${(() => {
    const next = new URLSearchParams();
    if (params.q) next.set("q", params.q);
    if (role !== "ALL") next.set("role", role);
    const search = next.toString();
    return `${search ? `?${search}&` : "?"}page={page}`;
  })()}`;

  return (
    <>
      <AdminPageHeader title="Customers" description={`${total} account${total === 1 ? "" : "s"} match the current filter`} />

      {params.updated === "1" && (
        <div className="mb-4">
          <Alert tone="success" title="Customer updated">
            Changes take effect immediately.
          </Alert>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="All accounts" value={String(Object.values(counts).reduce((a, b) => a + b, 0))} icon={<Users className="size-5" />} />
        <StatCard label="Shoppers" value={String(counts.CUSTOMER ?? 0)} tone="ocean" />
        <StatCard label="Vendors" value={String(counts.VENDOR ?? 0)} tone="amber" />
        <StatCard label="Administrators" value={String(counts.ADMIN ?? 0)} tone="brand" />
      </div>

      <div className="mt-5">
        <AdminPanel padded={false}>
          <div className="flex flex-wrap items-center gap-3 border-b border-ink-200 p-4 sm:p-5">
            <form action="/admin/customers" method="get" className="flex flex-1 flex-wrap items-center gap-2.5">
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search name or email…"
                aria-label="Search customers"
                className="h-10 min-w-[12rem] flex-1 rounded-xl border border-ink-300 px-3.5 text-[0.84rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12 sm:max-w-xs"
              />
              <select
                name="role"
                defaultValue={role}
                aria-label="Filter by role"
                className="h-10 rounded-xl border border-ink-300 px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none"
              >
                <option value="ALL">All roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="VENDOR">Vendors</option>
                <option value="ADMIN">Admins</option>
              </select>
              <button
                type="submit"
                className="h-10 rounded-xl bg-brand-600 px-4 text-[0.84rem] font-semibold text-white hover:bg-brand-700"
              >
                Filter
              </button>
            </form>
          </div>

          <div className="p-4 sm:p-5">
            <DataTable rows={customers} columns={columns} emptyMessage="No customers match this filter" caption="Customers" />
          </div>

          {totalPages > 1 && (
            <div className="border-t border-ink-200 px-4 py-4 sm:px-5">
              <Pagination page={page} totalPages={totalPages} hrefTemplate={hrefTemplate} className="justify-center" />
            </div>
          )}
        </AdminPanel>
      </div>
    </>
  );
}
