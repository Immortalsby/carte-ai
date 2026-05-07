import defaultMenuData from "../../data/menu.json";
import type { RestaurantMenu } from "@/types/menu";
import { restaurantMenuSchema } from "./validation";

export function getDefaultMenu(): RestaurantMenu {
  return restaurantMenuSchema.parse(defaultMenuData);
}

export function parseMenu(value: unknown): RestaurantMenu {
  return restaurantMenuSchema.parse(value);
}

export function findDishes(menu: RestaurantMenu, ids: string[]) {
  const byId = new Map(menu.dishes.map((dish) => [dish.id, dish]));
  return ids.flatMap((id) => {
    const dish = byId.get(id);
    return dish ? [dish] : [];
  });
}
