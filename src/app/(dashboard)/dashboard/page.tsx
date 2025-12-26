"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Package, Truck, Clock, CheckCircle2, AlertCircle } from "lucide-react"

export default function ShipperDashboard() {
  const stats = [
    {
      title: "Active Shipments",
      value: "12",
      icon: Truck,
      description: "Shipments currently in transit",
      color: "text-blue-600",
    },
    {
      title: "Pending Quotes",
      value: "5",
      icon: Clock,
      description: "Awaiting your acceptance",
      color: "text-amber-600",
    },
    {
      title: "Completed",
      value: "128",
      icon: CheckCircle2,
      description: "Successfully delivered orders",
      color: "text-emerald-600",
    },
    {
      title: "Drafts",
      value: "3",
      icon: Package,
      description: "Incomplete order requests",
      color: "text-slate-600",
    },
  ]

  const recentShipments = [
    {
      id: "SHP-001",
      destination: "Djibouti (Route A)",
      date: "Dec 22, 2025",
      status: "In Transit",
      statusVariant: "default" as const,
      containers: 2,
    },
    {
      id: "SHP-002",
      destination: "Djibouti (Route B)",
      date: "Dec 21, 2025",
      status: "Priced",
      statusVariant: "warning" as const,
      containers: 1,
    },
    {
      id: "SHP-003",
      destination: "Djibouti (Route A)",
      date: "Dec 20, 2025",
      status: "Delivered",
      statusVariant: "success" as const,
      containers: 5,
    },
    {
      id: "SHP-004",
      destination: "Djibouti (Route A)",
      date: "Dec 19, 2025",
      status: "Initiated",
      statusVariant: "secondary" as const,
      containers: 3,
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden transition-all hover:shadow-md border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold tracking-tight">
                {stat.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg bg-background shadow-xs", stat.color.replace('text-', 'bg-').replace('-600', '-50'))}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Shipments</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">View All</Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="font-bold">Order ID</TableHead>
                    <TableHead className="font-bold">Destination</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Containers</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentShipments.map((shipment) => (
                    <TableRow key={shipment.id} className="cursor-pointer transition-colors border-border/40">
                      <TableCell className="font-bold text-primary">{shipment.id}</TableCell>
                      <TableCell className="font-medium text-muted-foreground">{shipment.destination}</TableCell>
                      <TableCell className="text-muted-foreground">{shipment.date}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          {shipment.containers}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={shipment.statusVariant} className="font-bold shadow-none">
                          {shipment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Mobile-only shipment list */}
            <div className="divide-y divide-border/40 sm:hidden">
              {recentShipments.map((shipment) => (
                <div key={shipment.id} className="p-4 space-y-3 active:bg-accent/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-primary">{shipment.id}</span>
                    <Badge variant={shipment.statusVariant} className="font-bold text-[10px] px-1.5 py-0 shadow-none">
                      {shipment.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{shipment.destination}</p>
                      <p className="text-xs text-muted-foreground">{shipment.date}</p>
                    </div>
                    <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {shipment.containers}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/60 shadow-sm bg-accent/5">
          <CardHeader>
            <CardTitle>Action Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-background p-4 shadow-xs transition-all hover:border-amber-500/30 hover:shadow-sm group">
              <div className="p-2 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold leading-none group-hover:text-amber-700 transition-colors">
                  Review Quotes for SHP-002
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The system has calculated the price. You have <span className="font-bold text-amber-600">18 hours</span> left to accept.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-background p-4 shadow-xs transition-all hover:border-primary/30 hover:shadow-sm group">
              <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold leading-none group-hover:text-blue-700 transition-colors">
                  Advance Payment Due
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Shipment SHP-004 requires <span className="font-bold text-blue-600">5% advance payment</span> to proceed to loading.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-background p-4 shadow-xs transition-all hover:border-emerald-500/30 hover:shadow-sm group">
              <div className="p-2 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold leading-none group-hover:text-emerald-700 transition-colors">
                  POD Uploaded for SHP-003
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The transporter has uploaded the <span className="font-bold text-emerald-600">Proof of Delivery</span>. Please review and confirm.
                </p>
              </div>
            </div>

            <Button className="w-full mt-2 font-bold shadow-md" variant="outline">
              View All Notifications
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

