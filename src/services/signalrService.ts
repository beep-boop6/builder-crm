import * as signalR from "@microsoft/signalr";
import { backendBaseUrl } from '@/config/env';

class SignalRService {
    private connection: signalR.HubConnection | null = null;

    // Инициализация и запуск подключения
    public async startConnection(): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${backendBaseUrl}/crmConstructorHub`, {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000]) // Интервалы переподключения при разрыве
            .configureLogging(signalR.LogLevel.Information)
            .build();

        try {
            await this.connection.start();
            console.log("🟢 SignalR: Подключение успешно установлено.");
        } catch (err) {
            console.error("🔴 SignalR: Ошибка при подключении:", err);
            setTimeout(() => this.startConnection(), 5000); // Повторная попытка через 5 секунд
        }
    }

    // Остановка подключения (например, при выходе из редактора)
    public async stopConnection(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            console.log("🟡 SignalR: Подключение остановлено.");
        }
    }

    // =========================================================
    // МЕТОДЫ ОТПРАВКИ ДАННЫХ НА БЭКЕНД (Фронтенд -> Бэкенд)
    // =========================================================

    public isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    // Отправка текущего состояния элемента (актуально при перемещении/изменении в реальном времени)
    public async sendElementState(elementId: string, jsonState: string): Promise<boolean> {
        if (!this.isConnected()) {
            console.warn("SignalR: sendElementState пропущен — нет подключения к хабу.");
            return false;
        }

        try {
            await this.connection!.invoke("AddOrUpdateStateAsync", elementId, jsonState);
            return true;
        } catch (err) {
            console.error("SignalR: Не удалось отправить состояние элемента:", err);
            return false;
        }
    }

    // Сохранение финальной позиции элемента в базу данных (когда пользователь отпустил элемент)
    public async saveElementPosition(elementId: string, projectId: string): Promise<boolean> {
        if (!this.isConnected()) {
            console.warn("SignalR: saveElementPosition пропущен — нет подключения к хабу.");
            return false;
        }

        try {
            await this.connection!.invoke("SaveElementPositionAsync", elementId, projectId);
            return true;
        } catch (err) {
            console.error("SignalR: Не удалось сохранить позицию элемента в БД:", err);
            return false;
        }
    }

    /** Сначала актуальное состояние, затем сохранение в БД (порядок важен для бэкенда). */
    public async persistElement(elementId: string, projectId: string, jsonState: string): Promise<boolean> {
        const stateSent = await this.sendElementState(elementId, jsonState);
        if (!stateSent) {
            return false;
        }
        return this.saveElementPosition(elementId, projectId);
    }

    // Удаление элемента
    public async deleteElement(elementId: string): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            try {
                await this.connection.invoke("DeleteElementAsync", elementId);
            } catch (err) {
                console.error("SignalR: Не удалось удалить элемент:", err);
            }
        }
    }

    // =========================================================
    // ПОДПИСКИ НА СОБЫТИЯ БЭКЕНДА (Бэкенд -> Фронтенд)
    // =========================================================

    public onReceiveNewState(callback: (elementId: string, json: string) => void): void {
        this.connection?.on("ReceiveNewState", callback);
    }

    public onDeleteElement(callback: (elementId: string) => void): void {
        this.connection?.on("DeleteElement", callback);
    }

    public onDeleteAll(callback: () => void): void {
        this.connection?.on("DeleteAll", callback);
    }

    public onCreatePage(callback: (pageId: string) => void): void {
        this.connection?.on("CreatePage", callback);
    }

    public onDeletePage(callback: (pageId: string) => void): void {
        this.connection?.on("DeletePage", callback);
    }
}

export const signalrService = new SignalRService();