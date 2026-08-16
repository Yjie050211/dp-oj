// A1 采药：01 背包（Go）—— 应判 AC
package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	in := bufio.NewReader(os.Stdin)
	var V, N int
	fmt.Fscan(in, &V, &N)
	f := make([]int64, V+1)
	for i := 0; i < N; i++ {
		var c int
		var w int64
		fmt.Fscan(in, &c, &w)
		for v := V; v >= c; v-- {
			if f[v-c]+w > f[v] {
				f[v] = f[v-c] + w
			}
		}
	}
	fmt.Println(f[V])
}
