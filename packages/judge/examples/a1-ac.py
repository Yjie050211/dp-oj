# A1 采药：01 背包（Python）—— 应判 AC
import sys


def main():
    data = sys.stdin.read().split()
    V, N = int(data[0]), int(data[1])
    f = [0] * (V + 1)
    idx = 2
    for _ in range(N):
        c, w = int(data[idx]), int(data[idx + 1])
        idx += 2
        for v in range(V, c - 1, -1):
            nv = f[v - c] + w
            if nv > f[v]:
                f[v] = nv
    print(f[V])


main()
