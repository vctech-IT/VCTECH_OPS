// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			    user: {
					name: string
					role: string
					email: string
					id: string
					createdAt: Date
					phoneNo: string
					image: string
					status: string
					verificationToken: string;
					lastLogin: Date;
					lastLogout: Date;
					lastActivity: Date;
				}
			}
		interface PageData {
			user:
			{
				id: string;
				name: string;
				email: string;
				createdAt: Date;
				role: string;
				image: string;
				status: string;
				verificationToken: string;
				lastLogin: Date;
				lastLogout: Date;
				lastActivity: Date;
			}
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
