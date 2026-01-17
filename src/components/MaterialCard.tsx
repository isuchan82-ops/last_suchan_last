import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Coins } from "lucide-react";

export interface Material {
  id: string;
  title: string;
  price: number;
  tokenPrice?: number;
  type: "sale" | "buy" | "rent" | "lease";
  category?: "steel" | "concrete" | "wood" | "scaffold" | "equipment" | "other";
  location: string;
  imageUrl: string;
  timeAgo: string;
  status: "available" | "reserved" | "sold";
}

interface MaterialCardProps {
  material: Material;
}

const typeLabels = {
  sale: "판매",
  buy: "구매",
  rent: "대여",
  lease: "임대",
};

const statusLabels = {
  available: "거래가능",
  reserved: "예약중",
  sold: "거래완료",
};

const statusColors = {
  available: "bg-primary text-primary-foreground",
  reserved: "bg-secondary text-secondary-foreground",
  sold: "bg-muted text-muted-foreground",
};

export const MaterialCard = ({ material }: MaterialCardProps) => {
  return (
    <Link to={`/listing/${material.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={material.imageUrl}
            alt={material.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <Badge className={`absolute top-2 right-2 ${statusColors[material.status]}`}>
            {statusLabels[material.status]}
          </Badge>
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">{typeLabels[material.type]}</Badge>
          </div>
          <h3 className="mb-2 line-clamp-2 text-base font-semibold text-card-foreground">
            {material.title}
          </h3>
          <div className="mb-3 flex items-center gap-2">
            <p className="text-xl font-bold text-primary">
              {material.price.toLocaleString()}원
            </p>
            {material.tokenPrice && (
              <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                <Coins className="h-4 w-4" />
                <span>{material.tokenPrice}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{material.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{material.timeAgo}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
