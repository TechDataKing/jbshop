import * as Network from "expo-network";
import {
  findUnsyncedItems,
  findUnsyncedSales,
  Item,
  markItemSynced,
  markSaleSynced,
  Sale
} from "./db/database";
import { supabase } from "./supabase";

// Function to check network status
const checkNetwork = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    console.log('Network State:', networkState);
    return networkState.isConnected;
  } catch (error) {
    console.error('Error checking network state:', error);
    return false;
  }
};

// Function to sync items
const syncItems = async () => {
  try {
    const unsyncedItems = await findUnsyncedItems();
    if (unsyncedItems.length > 0) {
      const mapped = unsyncedItems.map((i: Item) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        alias: i.alias,
        mp: i.mp,
        sp: i.sp,
        unit: i.unit,
        target: i.target,
        created_at: i.created_at,
        updated_at: i.updated_at,
      }));

      const { error } = await supabase.from("items").upsert(mapped);
      if (!error) {
        for (const i of unsyncedItems) await markItemSynced(i.id);
        console.log("[sync] Items synced");
      }
    }
  } catch (err) {
    console.error("[sync] Error syncing items:", err);
  }
};

// Function to sync sales
const syncSales = async () => {
  try {
    const unsyncedSales = await findUnsyncedSales();
    if (unsyncedSales.length > 0) {
      const mapped = unsyncedSales.map((s: Sale) => ({
        id: s.id,
        name: s.name,
        mp: s.mp,
        sp: s.sp,
        qty: s.qty,
        subtotal: s.subtotal,
        created_at: s.created_at,
      }));

      const { error } = await supabase.from("sales").upsert(mapped);
      if (!error) {
        for (const s of unsyncedSales) await markSaleSynced(s.id);
        console.log("[sync] Sales synced");
      }
    }
  } catch (err) {
    console.error("[sync] Error syncing sales:", err);
  }
};

// Function to perform synchronization
export const autoSync = async () => {
  const isConnected = await checkNetwork();

  if (isConnected) {
    console.log("[sync] Device is online. Starting sync...");

    // Sync items and sales if connected
    await syncItems();
    await syncSales();

    console.log("[sync] Sync complete");
  } else {
    console.log("[sync] Device is offline. Sync skipped.");
  }
};

