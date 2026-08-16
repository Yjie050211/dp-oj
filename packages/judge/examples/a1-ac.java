// A1 采药：01 背包（Java）—— 应判 AC
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int V = sc.nextInt();
        int N = sc.nextInt();
        long[] f = new long[V + 1];
        for (int i = 0; i < N; i++) {
            int c = sc.nextInt();
            long w = sc.nextLong();
            for (int v = V; v >= c; v--) {
                f[v] = Math.max(f[v], f[v - c] + w);
            }
        }
        System.out.println(f[V]);
        sc.close();
    }
}
