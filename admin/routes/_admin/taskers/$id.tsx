import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, X, Star, FileText, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { useTaskerDetail } from "@/hooks/use-tasker-detail";
import { getInitial } from "@/lib/format";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { Tasker } from "@/lib/mock-data";

export const Route = createFileRoute("/_admin/taskers/$id")({
  component: TaskerDetail,
  notFoundComponent: () => <div className="p-8">Tasker not found</div>,
});

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-words max-w-[58%]">{value}</span>
    </div>
  );
}

function ProfileBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm text-left">
      <span className="text-muted-foreground block mb-1">{label}</span>
      <span className="font-medium leading-snug">{value}</span>
    </div>
  );
}

function CccdImageCard({ label, src }: { label: string; src?: string }) {
  return (
    <div className="w-[48%] min-w-0 flex flex-col gap-2">
      <p className="text-sm font-semibold text-center">{label}</p>
      {src ? (
        <img
          src={src}
          alt={label}
          className="w-full rounded-lg border border-border/80 bg-muted/30 object-contain"
          style={{ maxHeight: 220 }}
        />
      ) : (
        <div
          className="w-full rounded-lg border border-dashed border-border/80 bg-muted/20 flex items-center justify-center text-xs text-muted-foreground text-center px-2"
          style={{ minHeight: 160 }}
        >
          Chưa có ảnh
        </div>
      )}
    </div>
  );
}

function KycIdentityCard({ tasker, kyc }: { tasker: Tasker; kyc: NonNullable<Tasker["kyc"]> }) {
  const formatSubmittedAt = (iso?: string) => {
    if (!iso) return "—";
    try {
      return format(new Date(iso), "PPp");
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5 text-sm">
      <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
        <ProfileRow
          label="Họ tên KYC"
          value={kyc.fullName?.trim() || tasker.name}
        />
        <ProfileRow label="Ngày sinh KYC" value={kyc.dob?.trim() || "—"} />
        <ProfileRow
          label="Số điện thoại KYC"
          value={kyc.phone?.trim() || tasker.phone}
        />
        <ProfileBlock
          label="Địa chỉ KYC"
          value={kyc.address?.trim() || "—"}
        />
        <div className="pt-2 border-t border-border/60">
          <ProfileRow label="Thời gian nộp" value={formatSubmittedAt(kyc.submittedAt)} />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 text-center sm:text-left">
          Ảnh CCCD (Mặt trước &amp; Mặt sau)
        </p>
        <div className="flex flex-wrap justify-between gap-3">
          <CccdImageCard label="Mặt trước CCCD" src={kyc.cccdFront} />
          <CccdImageCard label="Mặt sau CCCD" src={kyc.cccdBack} />
        </div>
      </div>
    </div>
  );
}

function TaskerDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { tasker, loading, error, notFound, setTaskerStatus, setTaskerVerification } =
    useTaskerDetail(id);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (loading) {
    return (
      <div>
        <Button asChild variant="ghost" size="sm" className="rounded-xl mb-4">
          <Link to="/taskers">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to taskers
          </Link>
        </Button>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 w-full rounded-2xl lg:col-span-1" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !tasker) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Tasker not found.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/taskers">Back to taskers</Link>
        </Button>
      </div>
    );
  }

  const isBlocked = tasker.status === "blocked";
  const kyc = tasker?.kyc ?? null;
  const displayName = kyc?.fullName?.trim() || tasker.name;
  const displayPhone = kyc?.phone?.trim() || tasker.phone;
  const displayDob = kyc?.dob?.trim() || "—";
  const displayAddress = kyc?.address?.trim() || "—";

  const formatKycSubmittedAt = (iso?: string) => {
    if (!iso) return "—";
    try {
      return format(new Date(iso), "PPp");
    } catch {
      return iso;
    }
  };

  const toggleBlock = async () => {
    const next = isBlocked ? "active" : "blocked";
    try {
      await setTaskerStatus(next);
      toast.success(
        next === "blocked"
          ? `${displayName} has been blocked`
          : `${displayName} has been unblocked`,
      );
    } catch {
      toast.error("Failed to update tasker status");
    }
  };

  const approve = async () => {
    try {
      await setTaskerVerification("verified");
      toast.success(`${displayName} approved as verified tasker`);
      navigate({ to: "/taskers" });
    } catch {
      toast.error("Failed to verify tasker");
    }
  };

  const reject = async () => {
    try {
      await setTaskerVerification("rejected");
      toast.error(`${displayName}'s application rejected`);
      navigate({ to: "/taskers" });
    } catch {
      toast.error("Failed to reject tasker");
    }
  };

  console.log(">>> [ADMIN UI CHECK] Biến state đang dùng để render hiện tại là:", tasker);
  console.log(">>> [ADMIN UI CHECK] tasker.kyc đang render:", tasker.kyc);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="rounded-xl mb-4">
        <Link to="/taskers">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to taskers
        </Link>
      </Button>

      {isBlocked && (
        <Alert variant="destructive" className="mb-4 rounded-xl border-destructive/30 bg-destructive/10">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            This tasker account is blocked. Verification and approval actions are disabled until
            unblocked.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* —— Cột trái: hồ sơ tóm tắt (đồng bộ form Mobile) —— */}
        <Card className="lg:col-span-1 rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
          <CardContent className="p-6 text-center">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={tasker.avatar} />
              <AvatarFallback>{getInitial(displayName)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold mt-3">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{tasker.email}</p>
            <div className="mt-3 flex justify-center gap-2 flex-wrap">
              <StatusBadge status={tasker.status} />
              <StatusBadge status={tasker.verified} />
              <StatusBadge status={tasker.online ? "online" : "offline"} />
            </div>
            <Button variant="outline" className="rounded-xl w-full mt-4" onClick={toggleBlock}>
              {isBlocked ? "Unblock tasker" : "Block tasker"}
            </Button>

            <div className="grid grid-cols-3 gap-3 mt-6 text-center">
              <div>
                <div className="text-xl font-bold">{tasker.jobs}</div>
                <div className="text-xs text-muted-foreground">Jobs</div>
              </div>
              <div>
                <div className="text-xl font-bold flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {tasker.rating}
                </div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
              <div>
                <div className="text-xl font-bold">${(tasker.earnings / 1000).toFixed(1)}k</div>
                <div className="text-xs text-muted-foreground">Earnings</div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-left">
              <ProfileRow label="Họ và tên" value={displayName} />
              <ProfileRow label="Email" value={tasker.email} />
              <ProfileRow label="Số điện thoại" value={displayPhone} />
              <ProfileRow label="Ngày tham gia" value={tasker.joinDate} />
              <ProfileRow label="Ngày sinh" value={displayDob} />
              <ProfileBlock label="Địa chỉ thường trú" value={displayAddress} />
            </div>
          </CardContent>
        </Card>

        {/* —— Cột phải: KYC + ghi chú + duyệt —— */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                KYC — Identity verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasker?.kyc ? (
                <KycIdentityCard tasker={tasker} kyc={tasker.kyc} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center rounded-xl border border-dashed bg-muted/20">
                  Chưa nộp thông tin KYC — tasker has not submitted identity documents from the
                  mobile app yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add internal notes about this tasker…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl min-h-24"
              />
              <div className="text-sm space-y-2">
                <p className="font-semibold">Approval timeline</p>
                {[
                  { t: "Account created", d: tasker.joinDate },
                  ...(kyc?.submittedAt
                    ? [{ t: "KYC submitted", d: formatKycSubmittedAt(kyc.submittedAt) }]
                    : []),
                  {
                    t: "Verification status",
                    d:
                      tasker.verified === "verified"
                        ? "Verified"
                        : tasker.verified === "rejected"
                          ? "Rejected"
                          : "Pending review",
                  },
                ].map((e) => (
                  <div key={e.t} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 flex justify-between gap-2">
                      <span>{e.t}</span>
                      <span className="text-muted-foreground text-right">{e.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={approve}
              disabled={isBlocked}
              className="flex-1 rounded-xl h-11 bg-success hover:bg-success/90 text-primary-foreground disabled:opacity-50"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve tasker
            </Button>
            <Button
              onClick={reject}
              disabled={isBlocked}
              variant="destructive"
              className="flex-1 rounded-xl h-11 disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-1" />
              Reject application
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
