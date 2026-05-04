import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

interface Plan {
    name: string;
    max_bots: number;
    max_messages_monthly: number;
}

interface Usage {
    messages_sent: number;
    bot_count: number;
}

export const useSubscription = () => {
    const { user } = useAuth();
    const [plan, setPlan] = useState<Plan | null>(null);
    const [usage, setUsage] = useState<Usage>({ messages_sent: 0, bot_count: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch('/api/saas/subscription/usage', { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data.plan) setPlan(data.plan);
                    if (data.usage) setUsage(data.usage);
                }
            } catch (err) {
                console.error("Error fetching subscription data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const checkLimit = (type: 'bots' | 'messages') => {
        if (!plan) return true;
        if (type === 'bots') return usage.bot_count < plan.max_bots;
        if (type === 'messages') return usage.messages_sent < plan.max_messages_monthly;
        return true;
    };

    const getUsagePercent = (type: 'bots' | 'messages') => {
        if (!plan) return 0;
        const max = type === 'bots' ? plan.max_bots : plan.max_messages_monthly;
        const current = type === 'bots' ? usage.bot_count : usage.messages_sent;
        return Math.min(100, (current / max) * 100);
    };

    return { plan, usage, loading, checkLimit, getUsagePercent };
};
