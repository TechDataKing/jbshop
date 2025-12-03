import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from 'react';
import { initDB } from '../lib/db/database';

useEffect(() => {
  initDB();
}, []);


export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#222",
          paddingTop: 6,
          paddingBottom: 6,
          marginBottom:20,
        },
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "#aaa",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Sell",
          tabBarIcon: ({ color, size }:{color:string;size:number}) => (
            <Ionicons name="cart" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="create-worker"
        options={{
          title: "Create Worker",
          tabBarIcon: ({ color, size }:{color:string;size:number}) => (
            <Ionicons name="person-add" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="add-item"
        options={{
          title: "Add Item",
          tabBarIcon: ({ color, size }:{color:string;size:number}) => (
            <Ionicons name="add-circle" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="edit-item"
        options={{
          title: "Edit Item",
          tabBarIcon: ({ color, size }:{color:string;size:number}) => (
            <Ionicons name="create" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="manage-stock"
        options={{
          title: "Stock",
          tabBarIcon: ({ color, size }:{color:string;size:number}) => (
            <Ionicons name="cube" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }:{color:string;size:number}) => (
            <Ionicons name="analytics" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
