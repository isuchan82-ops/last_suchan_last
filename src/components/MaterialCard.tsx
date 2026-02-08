import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Coins, Pencil, Trash2 } from "lucide-react";

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
  user_id?: string;
}

interface MaterialCardProps {
  material: Material;
  isOwner?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
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

export const MaterialCard = ({ material, isOwner, onEdit, onDelete }: MaterialCardProps) => {
  return (
    <Link to={`/listing/${material.id}`} className="block">
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={material.imageUrl}
            alt={material.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <Badge className={`absolute top-2 right-2 ${statusColors[material.status]}`}>
            {statusLabels[material.status]}
          </Badge>
          {isOwner && (onEdit || onDelete) && (
            <div
              className="absolute top-2 left-2 flex gap-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {onEdit && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(material.id);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(material.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
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
