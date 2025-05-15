"use client"
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import  "@/lib/service";
import { toast } from "@/hooks/use-toast";
import { errorToString } from "@/lib/utils";

const queryClient = new QueryClient(
    {
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 1 * 60 * 1000, // 1 minute
            }
        },
        queryCache: new QueryCache({
            onError: (error, query) => {
                if (query.state.error) {
                    toast({
                        variant: "destructive",
                        title: query.meta?.errorMessage as string,
                        description: errorToString(error),
                    })
                }
            },
        })
    }
);

export const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}   