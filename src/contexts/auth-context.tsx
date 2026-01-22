"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, User, AuthResponse } from "@/lib/api";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    loginGuest: () => Promise<void>;
    webLogin: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        router.push("/");
    }, [router]);

    const verifySession = useCallback(async () => {
        try {
            const res = await api.get<User>("/auth/me");
            setUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
        } catch (error) {
            console.error("Session verification failed", error);
            // If 401, clear session
            logout();
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    // Load user from local storage on mount
    useEffect(() => {
        // Check if we have a token
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        // Check if we have user data (simplified for MVP, ideally verify token with /me endpoint)
        const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        }

        // If we have a token, we should verify it with the backend eventually
        // For now, we'll try to fetch the user if we have a token
        if (token) {
            verifySession();
        } else {
            setIsLoading(false);
        }
    }, [verifySession]);


    const loginGuest = async () => {
        setIsLoading(true);
        try {
            const response = await api.post<AuthResponse>("/auth/guest");
            const { access_token, user } = response.data;

            localStorage.setItem("token", access_token);
            localStorage.setItem("user", JSON.stringify(user));
            setUser(user);

            router.push("/dashboard");
        } catch (error) {
            console.error("Guest login failed", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const webLogin = () => {
        // Placeholder for Google OAuth
        // In real implementation, this would redirect to Google
        alert("Google OAuth is coming soon! Please use Guest Mode for now.");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, loginGuest, webLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
