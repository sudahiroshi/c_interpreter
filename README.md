# c_interpreter

## パーサのURL

https://github.com/Ren-Sekiya/research

## console版のセットアップ方法

node.jsの場合

```
$ npm install
```

bunの場合

```
$ bun install
```

## console版の実行例

node.jsの場合

```
$ node c_lang.js hello.c
```

bunの場合

```
$ bun run c_lang.js hello.c
```

## Web版のセットアップ方法

```
$ npm install
$ ./node_modules_bower/bin/bower install pegjs
```

## クラス一覧

クラス名 | 役割 |
-|-
Memory | メモリ空間を司る
Stack | スタック領域及びスタックポインタを司る
Scope | 変数のスコープを司る


