import * as signalR from "@microsoft/signalr";
import { backendBaseUrl } from '@/config/env';

const HUB_URL = `${backendBaseUrl}/crmConstructorHub`;

const HUB_TRANSPORTS =
    signalR.HttpTransportType.WebSockets
    | signalR.HttpTransportType.ServerSentEvents
    | signalR.HttpTransportType.LongPolling;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private connectionPromise: Promise<void> | null = null;

    private buildConnection(): signalR.HubConnection {
        return new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                skipNegotiation: false,
                transport: HUB_TRANSPORTS,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();
    }

    public async startConnection(): Promise<void> {
        if (this.isConnected()) {
            return;
        }

        if (this.connectionPromise) {
            await this.connectionPromise;
            return;
        }

        this.connectionPromise = this.connectOnce();
        try {
            await this.connectionPromise;
        } finally {
            this.connectionPromise = null;
        }
    }

    private async connectOnce(): Promise<void> {
        if (this.connection) {
            try {
                await this.connection.stop();
            } catch {
                // ignore stale connection shutdown errors
            }
            this.connection = null;
        }

        const connection = this.buildConnection();
        await connection.start();
        this.connection = connection;
        console.log('🟢 SignalR: подключение установлено.');
    }

    public clearEventHandlers(): void {
        if (!this.connection) {
            return;
        }
        const events = [
            'ReceiveNewState',
            'DeleteElement',
            'DeleteAll',
            'CreatePage',
            'RenamePage',
            'DeletePage',
            'ElementPositionUpdated',
        ] as const;
        for (const eventName of events) {
            this.connection.off(eventName);
        }
    }

    public async stopConnection(): Promise<void> {
        if (this.connection) {
            this.clearEventHandlers();
            await this.connection.stop();
            this.connection = null;
            console.log('🟡 SignalR: подключение остановлено.');
        }
    }

    public isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    /** Повторные попытки подключения (нужно до applyTemplate — редактор ещё не открыт). */
    public async ensureConnected(timeoutMs = 20000): Promise<boolean> {
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            if (this.isConnected()) {
                return true;
            }

            try {
                await this.startConnection();
                if (this.isConnected()) {
                    return true;
                }
            } catch (err) {
                console.warn('SignalR: повтор подключения...', err);
            }

            await sleep(1000);
        }

        return this.isConnected();
    }

    /** Создание и обновление элемента — SaveElementPositionAsync (upsert в БД на бэкенде). */
    public async saveElementPosition(
        elementId: string,
        pageId: string,
        jsonState: string
    ): Promise<boolean> {
        if (!(await this.ensureConnected())) {
            console.warn('SignalR: saveElementPosition пропущен — нет подключения к хабу.');
            return false;
        }

        try {
            await this.connection!.invoke(
                'SaveElementPositionAsync',
                elementId,
                pageId,
                jsonState
            );
            return true;
        } catch (err) {
            console.error('SignalR: не удалось сохранить элемент:', err);
            return false;
        }
    }

    public async createPage(pageId: string, name: string): Promise<void> {
        if (!(await this.ensureConnected())) {
            return;
        }

        try {
            await this.connection!.invoke('CreatePageAsync', pageId, name);
        } catch (err) {
            console.error('SignalR: не удалось уведомить о создании страницы:', err);
        }
    }

    public async renamePage(pageId: string, name: string): Promise<void> {
        if (!(await this.ensureConnected())) {
            return;
        }

        try {
            await this.connection!.invoke('RenamePageAsync', pageId, name);
        } catch (err) {
            console.error('SignalR: не удалось уведомить о переименовании страницы:', err);
        }
    }

    public async deletePage(pageId: string): Promise<void> {
        if (!(await this.ensureConnected())) {
            return;
        }

        try {
            await this.connection!.invoke('DeletePageAsync', pageId);
        } catch (err) {
            console.error('SignalR: не удалось уведомить об удалении страницы:', err);
        }
    }

    public async deleteElement(elementId: string): Promise<boolean> {
        if (!(await this.ensureConnected())) {
            console.warn('SignalR: deleteElement пропущен — нет подключения к хабу.');
            return false;
        }

        try {
            await this.connection!.invoke('DeleteElementAsync', elementId);
            return true;
        } catch (err) {
            console.error('SignalR: не удалось удалить элемент:', err);
            return false;
        }
    }

    private subscribe<T extends (...args: never[]) => void>(eventName: string, callback: T): void {
        this.connection?.off(eventName);
        this.connection?.on(eventName, callback);
    }

    public onReceiveNewState(callback: (elementId: string, json: string) => void): void {
        this.subscribe('ReceiveNewState', callback);
    }

    public onDeleteElement(callback: (elementId: string) => void): void {
        this.subscribe('DeleteElement', callback);
    }

    public onDeleteAll(callback: () => void): void {
        this.subscribe('DeleteAll', callback);
    }

    public onCreatePage(callback: (pageId: string, name: string) => void): void {
        this.subscribe('CreatePage', callback);
    }

    public onRenamePage(callback: (pageId: string, name: string) => void): void {
        this.subscribe('RenamePage', callback);
    }

    public onDeletePage(callback: (pageId: string) => void): void {
        this.subscribe('DeletePage', callback);
    }

    public onElementPositionUpdated(
        callback: (elementId: string, pageId: string, jsonState: string) => void
    ): void {
        this.subscribe('ElementPositionUpdated', callback);
    }
}

export const signalrService = new SignalRService();
