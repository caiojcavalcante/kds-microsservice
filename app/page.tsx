"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, ChefHat, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import Image from "next/image"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-24 overflow-hidden">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-sm lg:flex">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sm:hidden fixed left-0 top-0 flex flex-col items-center w-full justify-center border-b bg-black pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30"
        >
          <Image
            src="/logo.jpeg"
            alt="Logo"
            width={100}
            height={100}
            className="mr-2 mix-blend-screen"
          />
          <code className="font-mono font-bold text-red-600">
            Ferro e Fogo Parrilla
          </code>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-to-br before:from-red-500 before:to-transparent before:opacity-10 before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-to-t after:from-red-900 after:via-red-500 after:opacity-20 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-red-700 before:dark:opacity-10 after:dark:from-red-900 after:dark:via-[#ff0000] after:dark:opacity-20 z-[-1]"
      >
        <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 dark:from-neutral-100 dark:to-neutral-800">
          KDS System
        </h1>
      </motion.div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left gap-8 mt-16">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link href="/pdv" passHref>
            <Card className="group border-transparent bg-neutral-100/50 dark:bg-neutral-900/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-fire cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Monitor className="h-6 w-6 text-red-500" />
                  PDV
                </CardTitle>
                <CardDescription>
                  Ponto de Venda para lançamento de pedidos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Interface otimizada para garçons e caixas lançarem pedidos com rapidez e eficiência.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="group-hover:text-red-500 group-hover:translate-x-1 transition-all">
                  Acessar PDV <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link href="/kds" passHref>
            <Card className="group border-transparent bg-neutral-100/50 dark:bg-neutral-900/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-fire cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <ChefHat className="h-6 w-6 text-red-500" />
                  Cozinha (KDS)
                </CardTitle>
                <CardDescription>
                  Kitchen Display System para gestão de pedidos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize e gerencie os pedidos em tempo real na cozinha, melhorando o fluxo de trabalho.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="group-hover:text-red-500 group-hover:translate-x-1 transition-all">
                  Acessar KDS <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
